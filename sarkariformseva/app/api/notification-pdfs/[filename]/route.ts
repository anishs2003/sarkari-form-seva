import { NextResponse } from "next/server";
import { getPublishedNotificationByPdfUrl } from "@/lib/public-notifications";
import { createNotificationPdfSignedUrl, isNotificationPdfObjectPath } from "@/lib/notification-pdf-storage";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const path = `notification-pdfs/${filename}`;
  if (!isNotificationPdfObjectPath(path)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const publishedItem = await getPublishedNotificationByPdfUrl(`/api/notification-pdfs/${filename}`);
  if (!publishedItem) return NextResponse.json({ error: "Not found." }, { status: 404 });

  try {
    const signedUrl = await createNotificationPdfSignedUrl(path);
    return NextResponse.redirect(signedUrl, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Notification PDF download link failed.", error);
    return NextResponse.json({ error: "Download is temporarily unavailable." }, { status: 503 });
  }
}
