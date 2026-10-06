import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin-api-auth";
import { mapNotificationRow } from "@/lib/public-notifications";
import { supabaseErrorMessage, supabaseHeaders, tryGetSupabaseServerConfig } from "@/lib/supabase-rest";
import type { NotificationItem, NotificationStatus } from "@/lib/types";

type NotificationPayload = Partial<NotificationItem> & { id?: string };
const statuses: NotificationStatus[] = ["draft", "pending-review", "approved", "published", "rejected", "archived"];

function toDatabaseRecord(item: NotificationPayload, status: NotificationStatus, slug?: string) {
  const title = String(item.title ?? "").trim();
  return {
    ...(slug ? { slug } : {}),
    title,
    organization: String(item.organization ?? "").trim(),
    category: item.category ?? "Other",
    short_description: String(item.shortDescription ?? "").trim(),
    description: String(item.description ?? item.shortDescription ?? "").trim(),
    start_date: item.applicationStartDate || null,
    last_date: item.lastDate || null,
    exam_date: item.examDate || null,
    vacancy: item.vacancy ?? "",
    qualification: item.qualification ?? "",
    eligibility: item.eligibility ?? "",
    age_limit: item.ageLimit ?? "",
    application_fee: item.applicationFee ?? "",
    service_charge: item.serviceCharge ?? "",
    required_documents: item.requiredDocuments ?? "",
    notification_pdf_url: item.notificationPdfUrl ?? null,
    official_notification_url: item.officialNotificationUrl ?? "",
    official_website_url: item.officialWebsiteUrl ?? "",
    apply_online_url: item.applyOnlineUrl ?? "",
    featured: item.featured === true,
    keep_visible_after_last_date: item.keepVisibleAfterLastDate === true,
    source: item.source || "Admin entry",
    status,
    ...(status === "published" ? { published_at: item.status === "published" ? undefined : new Date().toISOString() } : {}),
  };
}

async function listNotifications(config: { url: string; key: string }): Promise<NotificationItem[]> {
  const url = new URL(`${config.url}/rest/v1/notifications`);
  url.searchParams.set("select", "*");
  url.searchParams.set("order", "published_at.desc.nullslast,created_at.desc");
  url.searchParams.set("limit", "1000");
  const response = await fetch(url, { headers: supabaseHeaders(config.key), cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase notifications query failed: ${await supabaseErrorMessage(response)}.`);
  return (await response.json() as Record<string, unknown>[]).map(mapNotificationRow);
}

function errorResponse(error: unknown, fallback: string) {
  return NextResponse.json({ error: error instanceof Error ? error.message : fallback }, { status: 502 });
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const database = tryGetSupabaseServerConfig();
  if (!database.config) return NextResponse.json({ error: database.error }, { status: 503 });
  try { return NextResponse.json({ success: true, items: await listNotifications(database.config) }); }
  catch (error) { return errorResponse(error, "Could not load notifications."); }
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const database = tryGetSupabaseServerConfig();
  if (!database.config) return NextResponse.json({ error: database.error }, { status: 503 });
  const item = await request.json().catch(() => null) as NotificationPayload | null;
  if (!item || typeof item.title !== "string" || !item.title.trim() || typeof item.organization !== "string" || !item.organization.trim()) {
    return NextResponse.json({ error: "Notification title and organization are required." }, { status: 400 });
  }
  const status = statuses.includes(item.status as NotificationStatus) ? item.status as NotificationStatus : "draft";
  try {
    const current = await listNotifications(database.config);
    const baseSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "notification";
    const usedSlugs = new Set(current.map((entry) => entry.slug.toLowerCase()));
    let slug = baseSlug;
    for (let suffix = 2; usedSlugs.has(slug); suffix += 1) slug = `${baseSlug}-${suffix}`;
    const response = await fetch(`${database.config.url}/rest/v1/notifications`, {
      method: "POST",
      headers: supabaseHeaders(database.config.key, { "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify([toDatabaseRecord(item, status, slug)]),
      cache: "no-store",
    });
    if (!response.ok) return errorResponse(new Error(`Supabase notification insert failed: ${await supabaseErrorMessage(response)}.`), "Could not save notification.");
    const rows = await response.json() as Record<string, unknown>[];
    if (!rows[0]) return NextResponse.json({ error: "Notification was saved without a returned record." }, { status: 502 });
    return NextResponse.json({ success: true, item: mapNotificationRow(rows[0]) }, { status: 201 });
  } catch (error) { return errorResponse(error, "Could not save notification."); }
}

export async function PATCH(request: Request) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const database = tryGetSupabaseServerConfig();
  if (!database.config) return NextResponse.json({ error: database.error }, { status: 503 });
  const payload = await request.json().catch(() => null) as NotificationPayload | null;
  const id = typeof payload?.id === "string" ? payload.id : "";
  if (!payload || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid notification record." }, { status: 400 });
  try {
    const items = await listNotifications(database.config);
    const existing = items.find((item) => item.id === id);
    if (!existing) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    const candidate = { ...existing, ...payload };
    const status = payload.status === undefined ? existing.status : statuses.includes(payload.status as NotificationStatus) ? payload.status as NotificationStatus : null;
    if (!status) return NextResponse.json({ error: "Invalid notification status." }, { status: 400 });
    const record = toDatabaseRecord(candidate, status);
    delete (record as Record<string, unknown>).published_at;
    if (status === "published" && existing.status !== "published") (record as Record<string, unknown>).published_at = new Date().toISOString();
    const url = new URL(`${database.config.url}/rest/v1/notifications`);
    url.searchParams.set("id", `eq.${id}`);
    const response = await fetch(url, {
      method: "PATCH",
      headers: supabaseHeaders(database.config.key, { "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify(record),
      cache: "no-store",
    });
    if (!response.ok) return errorResponse(new Error(`Supabase notification update failed: ${await supabaseErrorMessage(response)}.`), "Could not update notification.");
    const rows = await response.json() as Record<string, unknown>[];
    if (!rows[0]) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    return NextResponse.json({ success: true, item: mapNotificationRow(rows[0]) });
  } catch (error) { return errorResponse(error, "Could not update notification."); }
}

export async function DELETE(request: Request) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const database = tryGetSupabaseServerConfig();
  if (!database.config) return NextResponse.json({ error: database.error }, { status: 503 });
  const body = await request.json().catch(() => null) as { id?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid notification record." }, { status: 400 });
  const url = new URL(`${database.config.url}/rest/v1/notifications`);
  url.searchParams.set("id", `eq.${id}`);
  try {
    const response = await fetch(url, { method: "DELETE", headers: supabaseHeaders(database.config.key, { Prefer: "return=representation" }), cache: "no-store" });
    if (!response.ok) return errorResponse(new Error(`Supabase notification delete failed: ${await supabaseErrorMessage(response)}.`), "Could not delete notification.");
    const rows = await response.json() as unknown[];
    if (!rows.length) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) { return errorResponse(error, "Could not delete notification."); }
}
