import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getApplicationDocumentRequirements } from "@/lib/application-documents";
import { isExpiredForm } from "@/lib/form-deadlines";
import { getPublishedFormBySlugResult } from "@/lib/public-forms";
import { deleteApplicationDocument, uploadApplicationDocument } from "@/lib/payment-storage";
import { supabaseErrorMessage, supabaseHeaders, tryGetSupabaseServerConfig } from "@/lib/supabase-rest";

export const runtime = "nodejs";

const documentTypes = {
  "image/jpeg": { extension: "jpg", signature: (bytes: Buffer) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", signature: (bytes: Buffer) => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { extension: "webp", signature: (bytes: Buffer) => bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" },
  "application/pdf": { extension: "pdf", signature: (bytes: Buffer) => bytes.subarray(0, 1024).includes(Buffer.from("%PDF-")) },
};

export async function POST(request: Request) {
  const database = tryGetSupabaseServerConfig();
  if (!database.config) return NextResponse.json({ error: database.error }, { status: 503 });
  const config = database.config;

  const maxFileSizeMb = Number(process.env.APPLICATION_DOCUMENT_MAX_SIZE_MB) > 0
    ? Number(process.env.APPLICATION_DOCUMENT_MAX_SIZE_MB)
    : 5;
  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid application submission." }, { status: 400 });

  const slug = String(formData.get("formSlug") ?? "").trim();
  const student = (() => {
    try { return JSON.parse(String(formData.get("student") ?? "{}")) as Record<string, unknown>; }
    catch { return null; }
  })();
  const documentIds = (() => {
    try { return JSON.parse(String(formData.get("documentIds") ?? "[]")) as unknown; }
    catch { return null; }
  })();
  if (!slug || !student || !Array.isArray(documentIds) || !student.name || !student.mobile || !student.email) {
    return NextResponse.json({ error: "Complete student details and select a published form." }, { status: 400 });
  }

  const formResult = await getPublishedFormBySlugResult(slug);
  if (formResult.error) return NextResponse.json({ error: formResult.error }, { status: 503 });
  const item = formResult.item;
  if (!item) return NextResponse.json({ error: "Published form was not found." }, { status: 404 });
  if (isExpiredForm(item) && !item.keepVisibleAfterLastDate) {
    return NextResponse.json({ error: "Application Closed. The last date has passed." }, { status: 410 });
  }

  const requirements = getApplicationDocumentRequirements(item.requiredDocuments);
  if (requirements.length > 30) return NextResponse.json({ error: "This form has too many configured document requirements." }, { status: 422 });
  const selectedIds = new Set(documentIds.filter((value): value is string => typeof value === "string"));
  if ([...selectedIds].some((id) => !requirements.some((requirement) => requirement.id === id))) {
    return NextResponse.json({ error: "Unexpected document selection." }, { status: 400 });
  }
  const applicationUuid = randomUUID();
  const applicationCode = `SFS-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const uploaded: { id: string; file: File; storagePath: string; requirement: (typeof requirements)[number]; contentType: string }[] = [];
  for (const requirement of requirements) {
    const entry = formData.get(`document:${requirement.id}`);
    if (!(entry instanceof File) || entry.size === 0) {
      if (requirement.required) return NextResponse.json({ error: `Upload the required document: ${requirement.label}.` }, { status: 400 });
      continue;
    }
    const type = documentTypes[entry.type as keyof typeof documentTypes];
    if (!type || !entry.name.toLowerCase().endsWith(`.${type.extension}`)) {
      return NextResponse.json({ error: `${requirement.label} must be JPG, PNG, WebP, or PDF.` }, { status: 415 });
    }
    if (entry.size > maxFileSizeMb * 1024 * 1024) {
      return NextResponse.json({ error: `${requirement.label} must be ${maxFileSizeMb} MB or smaller.` }, { status: 413 });
    }
    const bytes = Buffer.from(await entry.arrayBuffer());
    if (!type.signature(bytes)) return NextResponse.json({ error: `${requirement.label} file content is invalid.` }, { status: 415 });
    uploaded.push({ id: requirement.id, file: entry, storagePath: `application-documents/${applicationUuid}/${randomUUID()}.${type.extension}`, requirement, contentType: entry.type });
  }

  const uploadedPaths: string[] = [];
  let applicationCreated = false;
  try {
    for (const document of uploaded) {
      const bytes = Buffer.from(await document.file.arrayBuffer());
      const result = await uploadApplicationDocument(document.storagePath, new Uint8Array(bytes), document.contentType);
      if (!result.ok) throw new Error(`Storage rejected ${document.requirement.label}.`);
      uploadedPaths.push(document.storagePath);
    }

    const application = await fetch(`${config.url}/rest/v1/applications`, {
      method: "POST",
      headers: supabaseHeaders(config.key, { "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify([{
        id: applicationUuid,
        student_id: null,
        notification_id: null,
        form_slug: item.slug,
        form_title: item.title,
        student_name: String(student.name).trim(),
        student_mobile: String(student.mobile).trim(),
        student_email: String(student.email).trim(),
        date_of_birth: String(student.dob ?? ""),
        gender: String(student.gender ?? ""),
        service_name: item.title,
        status: "Draft",
        payment_status: "Pending",
        application_id: applicationCode,
      }]),
      cache: "no-store",
    });
    if (!application.ok) throw new Error(`Application record rejected: ${await supabaseErrorMessage(application)}.`);
    applicationCreated = true;

    if (uploaded.length) {
      const documentRows = uploaded.map((document) => ({
        application_id: applicationUuid,
        document_type: document.requirement.label,
        file_name: document.file.name,
        storage_path: document.storagePath,
        mime_type: document.contentType,
      }));
      const documentInsert = await fetch(`${config.url}/rest/v1/documents`, {
        method: "POST",
        headers: supabaseHeaders(config.key, { "Content-Type": "application/json", Prefer: "return=minimal" }),
        body: JSON.stringify(documentRows),
        cache: "no-store",
      });
      if (!documentInsert.ok) throw new Error(`Document records could not be saved: ${await supabaseErrorMessage(documentInsert)}.`);
    }

    return NextResponse.json({ applicationId: applicationUuid, applicationCode, status: "Draft" }, { status: 201 });
  } catch (error) {
    if (applicationCreated) {
      await fetch(`${config.url}/rest/v1/applications?id=eq.${encodeURIComponent(applicationUuid)}`, {
        method: "DELETE",
        headers: supabaseHeaders(config.key),
        cache: "no-store",
      }).catch(() => undefined);
    }
    await Promise.all(uploadedPaths.map((path) => deleteApplicationDocument(path).catch(() => undefined)));
    console.error("Application creation failed.", error);
    return NextResponse.json({ error: "Application could not be saved securely. Please try again." }, { status: 503 });
  }
}
