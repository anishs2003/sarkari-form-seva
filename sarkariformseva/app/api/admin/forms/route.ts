import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin-api-auth";
import { recordFormAuditEvents, type FormAuditAction } from "@/lib/admin-audit-log";
import { findDuplicateForms } from "@/lib/form-duplicates";
import { mapFormRow } from "@/lib/public-forms";
import { supabaseErrorMessage, supabaseHeaders, tryGetSupabaseServerConfig } from "@/lib/supabase-rest";
import type { NotificationItem, NotificationStatus } from "@/lib/types";

type FormPayload = Partial<NotificationItem> & { id?: string };

function getDatabaseConfig() {
  return tryGetSupabaseServerConfig();
}

function failure(auth: Extract<Awaited<ReturnType<typeof authorizeAdminRequest>>, { authorized: false }>) {
  return NextResponse.json({ error: auth.error }, { status: auth.status });
}

async function listRows(url: string, key: string): Promise<NotificationItem[]> {
  const response = await fetch(`${url}/rest/v1/forms?select=*&order=published_at.desc.nullslast&limit=1000`, {
    headers: supabaseHeaders(key),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase forms query failed: ${await supabaseErrorMessage(response)}.`);
  const rows = await response.json() as Record<string, unknown>[];
  return rows.map(mapFormRow);
}

function normalizeStatus(value: unknown): NotificationStatus | null {
  return ["draft", "pending-review", "published", "archived"].includes(String(value))
    ? value as NotificationStatus
    : null;
}

function toDatabaseRecord(item: FormPayload, status: NotificationStatus, slug?: string) {
  const title = String(item.title ?? "").trim();
  const now = new Date().toISOString();
  return {
    ...(slug ? { slug } : {}),
    name: title,
    title,
    organization: String(item.organization ?? "").trim(),
    category: item.category,
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
    active: status === "published",
    source: item.source || "Admin entry",
    seo_title: item.seoTitle || title,
    meta_description: item.metaDescription || item.shortDescription || item.description || "",
    status,
    ...(status === "published" ? { published_at: item.status === "published" ? undefined : now } : {}),
  };
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.authorized) return failure(auth);
  const database = getDatabaseConfig();
  if (!database.config) return NextResponse.json({ error: database.error }, { status: 503 });
  try {
    return NextResponse.json({ items: await listRows(database.config.url, database.config.key) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load forms." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.authorized) return failure(auth);
  const database = getDatabaseConfig();
  if (!database.config) return NextResponse.json({ error: database.error }, { status: 503 });
  const config = database.config;

  const item = await request.json().catch(() => null) as FormPayload | null;
  if (!item || typeof item.title !== "string" || !item.title.trim() || typeof item.organization !== "string" || !item.organization.trim() || typeof item.category !== "string") {
    return NextResponse.json({ error: "Form Name, Organization, and Category are required." }, { status: 400 });
  }
  const status = normalizeStatus(item.status) ?? "draft";
  let items: NotificationItem[];
  try { items = await listRows(config.url, config.key); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not check for duplicate forms." }, { status: 502 }); }
  const duplicates = findDuplicateForms(items, {
    title: item.title,
    organization: item.organization,
    applicationStartDate: item.applicationStartDate ?? "",
    lastDate: item.lastDate ?? "",
    examDate: item.examDate ?? "",
    officialNotificationUrl: item.officialNotificationUrl ?? "",
    notificationPdfUrl: item.notificationPdfUrl ?? "",
    officialWebsiteUrl: item.officialWebsiteUrl ?? "",
    applyOnlineUrl: item.applyOnlineUrl ?? "",
  });
  if (duplicates.length) return NextResponse.json({ error: "A matching form already exists.", duplicates }, { status: 409 });

  const slugBase = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "new-form";
  const existingSlugs = new Set(items.map((entry) => entry.slug.toLowerCase()));
  let slug = slugBase;
  let suffix = 2;
  while (existingSlugs.has(slug)) {
    slug = `${slugBase}-${suffix}`;
    suffix += 1;
  }

  try {
    const record = toDatabaseRecord(item, status, slug);
    if (status === "published") (record as Record<string, unknown>).published_at = new Date().toISOString();
    const response = await fetch(`${config.url}/rest/v1/forms`, {
      method: "POST",
      headers: supabaseHeaders(config.key, { "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify([record]),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: `Could not create the form: ${await supabaseErrorMessage(response)}.` }, { status: 502 });
    const rows = await response.json() as Record<string, unknown>[];
    const savedItem = rows[0] ? mapFormRow(rows[0]) : null;
    if (!savedItem) return NextResponse.json({ error: "Form was created but could not be read back." }, { status: 502 });
    const auditEvents: { action: FormAuditAction; metadata?: Record<string, unknown> }[] = [{ action: "Form Created", metadata: { title: savedItem.title, status } }];
    if (status === "published") auditEvents.push({ action: "Form Published" });
    if (savedItem.notificationPdfUrl) auditEvents.push({ action: "PDF Uploaded", metadata: { storageUrl: savedItem.notificationPdfUrl } });
    const auditLogged = await recordFormAuditEvents(auth.userId, savedItem.id, auditEvents);
    return NextResponse.json({ item: savedItem, auditLogged }, { status: 201 });
  } catch (error) {
    console.error("Admin form creation failed.", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create the form." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.authorized) return failure(auth);
  const database = getDatabaseConfig();
  if (!database.config) return NextResponse.json({ error: database.error }, { status: 503 });
  const config = database.config;

  const payload = await request.json().catch(() => null) as FormPayload | null;
  const id = typeof payload?.id === "string" ? payload.id : "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !payload) return NextResponse.json({ error: "Invalid form record." }, { status: 400 });
  let items: NotificationItem[];
  try { items = await listRows(config.url, config.key); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not validate the form update." }, { status: 502 }); }
  const existing = items.find((entry) => entry.id === id);
  if (!existing) return NextResponse.json({ error: "Form not found." }, { status: 404 });

  const candidate = { ...existing, ...payload };
  const duplicates = findDuplicateForms(items, candidate, id);
  if (duplicates.length) return NextResponse.json({ error: "The update matches another existing form.", duplicates }, { status: 409 });

  const status = payload.status === undefined ? existing.status : normalizeStatus(payload.status);
  if (!status) return NextResponse.json({ error: "Invalid form status." }, { status: 400 });
  const record = toDatabaseRecord(candidate, status);
  delete (record as Record<string, unknown>).published_at;
  if (payload.status === "published" && existing.status !== "published") (record as Record<string, unknown>).published_at = new Date().toISOString();

  const url = new URL(`${config.url}/rest/v1/forms`);
  url.searchParams.set("id", `eq.${id}`);
  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: supabaseHeaders(config.key, { "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify(record),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: `Could not update the form: ${await supabaseErrorMessage(response)}.` }, { status: 502 });
    const rows = await response.json() as Record<string, unknown>[];
    if (!rows.length) return NextResponse.json({ error: "Form not found." }, { status: 404 });
    const savedItem = mapFormRow(rows[0]);
    const auditEvents: { action: FormAuditAction; metadata?: Record<string, unknown> }[] = [{ action: "Form Edited" }];
    if (existing.status !== "published" && status === "published") auditEvents.push({ action: "Form Published" });
    if (existing.status === "published" && status !== "published") auditEvents.push({ action: "Form Unpublished" });
    if ((existing.serviceCharge ?? "") !== (savedItem.serviceCharge ?? "")) {
      auditEvents.push({ action: "Service Charge Changed", metadata: { previous: existing.serviceCharge ?? "", current: savedItem.serviceCharge ?? "" } });
    }
    if ((existing.notificationPdfUrl ?? "") !== (savedItem.notificationPdfUrl ?? "")) {
      auditEvents.push(savedItem.notificationPdfUrl
        ? { action: "PDF Uploaded", metadata: { storageUrl: savedItem.notificationPdfUrl } }
        : { action: "PDF Removed" });
    }
    const auditLogged = await recordFormAuditEvents(auth.userId, id, auditEvents);
    return NextResponse.json({ item: savedItem, auditLogged });
  } catch (error) {
    console.error("Admin form update failed.", error);
    return NextResponse.json({ error: "Could not update the form." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.authorized) return failure(auth);
  const database = getDatabaseConfig();
  if (!database.config) return NextResponse.json({ error: database.error }, { status: 503 });
  const config = database.config;
  const body = await request.json().catch(() => null) as { id?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid form record." }, { status: 400 });

  const url = new URL(`${config.url}/rest/v1/forms`);
  url.searchParams.set("id", `eq.${id}`);
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: supabaseHeaders(config.key, { Prefer: "return=representation" }),
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "Could not delete the form." }, { status: 502 });
    const rows = await response.json() as Record<string, unknown>[];
    if (!rows.length) return NextResponse.json({ error: "Form not found." }, { status: 404 });
    const deleted = mapFormRow(rows[0]);
    const auditLogged = await recordFormAuditEvents(auth.userId, id, [{ action: "Form Deleted", metadata: { title: deleted.title } }]);
    return NextResponse.json({ success: true, auditLogged });
  } catch (error) {
    console.error("Admin form deletion failed.", error);
    return NextResponse.json({ error: "Could not delete the form." }, { status: 503 });
  }
}
