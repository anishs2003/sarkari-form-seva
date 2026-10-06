import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin-api-auth";
import { createApplicationDocumentUrl, isApplicationDocumentPath } from "@/lib/payment-storage";
import { supabaseHeaders, tryGetSupabaseServerConfig } from "@/lib/supabase-rest";

const allowedStatuses = ["Under Review", "Information Required", "Form Filling In Progress", "Form Submitted", "Completed", "Rejected"];
function config() {
  return tryGetSupabaseServerConfig();
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const database = config();
  if (!database.config) return NextResponse.json({ error: database.error }, { status: 503 });
  const db = database.config;
  try {
    const url = new URL(`${db.url}/rest/v1/applications`);
    url.searchParams.set("select", "*");
    url.searchParams.set("status", "neq.Draft");
    url.searchParams.set("order", "created_at.desc");
    url.searchParams.set("limit", "500");
    const response = await fetch(url, { headers: supabaseHeaders(db.key), cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "Could not load applications." }, { status: 502 });
    const applications = await response.json() as Record<string, unknown>[];
    const ids = applications.map((item) => String(item.id));
    let docs: Record<string, unknown>[] = [];
    if (ids.length) {
      const url = new URL(`${db.url}/rest/v1/documents`);
      url.searchParams.set("select", "application_id,document_type,file_name,storage_path,mime_type");
      url.searchParams.set("application_id", `in.(${ids.join(",")})`);
      const result = await fetch(url, { headers: supabaseHeaders(db.key), cache: "no-store" });
      if (!result.ok) return NextResponse.json({ error: "Could not load application documents." }, { status: 502 });
      docs = await result.json() as Record<string, unknown>[];
    }
    const documents = await Promise.all(docs.map(async (doc) => ({
      application_id: doc.application_id,
      document_type: doc.document_type,
      file_name: doc.file_name,
      url: typeof doc.storage_path === "string" && isApplicationDocumentPath(doc.storage_path) ? await createApplicationDocumentUrl(doc.storage_path).catch(() => "") : "",
    })));
    return NextResponse.json({ items: applications, documents });
  } catch {
    return NextResponse.json({ error: "Could not load applications." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const database = config();
  if (!database.config) return NextResponse.json({ error: database.error }, { status: 503 });
  const db = database.config;
  const body = await request.json().catch(() => null) as { id?: unknown; status?: unknown; adminMessage?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || typeof body?.status !== "string" || !allowedStatuses.includes(body.status)) return NextResponse.json({ error: "Invalid application update." }, { status: 400 });
  const url = new URL(`${db.url}/rest/v1/applications`);
  url.searchParams.set("id", `eq.${id}`);
  try {
    const response = await fetch(url, { method: "PATCH", headers: supabaseHeaders(db.key, { "Content-Type": "application/json", Prefer: "return=representation" }), body: JSON.stringify({ status: body.status, admin_message: typeof body.adminMessage === "string" ? body.adminMessage.slice(0, 1000) : "" }), cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "Could not update application status." }, { status: 502 });
    const rows = await response.json() as unknown[];
    if (!rows.length) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not update application status." }, { status: 503 });
  }
}
