import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getNotificationPdfMaxSizeMb } from "@/lib/notification-pdf-config";
import { authorizeAdminRequest } from "@/lib/admin-api-auth";
import { isNotificationPdfObjectPath, removeNotificationPdf, uploadNotificationPdf } from "@/lib/notification-pdf-storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const maxSize = getNotificationPdfMaxSizeMb() * 1024 * 1024;
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxSize + 1024 * 1024) {
    return NextResponse.json({ error: `PDF must be ${getNotificationPdfMaxSizeMb()} MB or smaller.` }, { status: 413 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Select a PDF file to upload." }, { status: 400 });
  }

  if (file.size > maxSize) {
    return NextResponse.json({ error: `PDF must be ${getNotificationPdfMaxSizeMb()} MB or smaller.` }, { status: 413 });
  }
  if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 415 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!bytes.subarray(0, 1024).includes(Buffer.from("%PDF-"))) {
    return NextResponse.json({ error: "The selected file is not a valid PDF." }, { status: 415 });
  }

  const storagePath = `notification-pdfs/${randomUUID()}.pdf`;
  try {
    const response = await uploadNotificationPdf(storagePath, bytes);
    if (!response.ok) {
      return NextResponse.json({ error: "Could not store the PDF securely." }, { status: 502 });
    }
    return NextResponse.json({ path: storagePath, downloadUrl: `/api/notification-pdfs/${storagePath.split("/").at(-1)}` });
  } catch (error) {
    console.error("Notification PDF upload failed.", error);
    return NextResponse.json({ error: "PDF storage is not configured or is unavailable." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => null) as { path?: unknown } | null;
  const path = typeof body?.path === "string" ? body.path : "";
  if (!isNotificationPdfObjectPath(path)) {
    return NextResponse.json({ error: "Invalid notification PDF path." }, { status: 400 });
  }

  try {
    const response = await removeNotificationPdf(path);
    if (!response.ok && response.status !== 404) {
      return NextResponse.json({ error: "Could not remove the stored PDF." }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification PDF removal failed.", error);
    return NextResponse.json({ error: "PDF storage is not configured or is unavailable." }, { status: 503 });
  }
}
