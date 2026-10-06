import type { NotificationCategory, NotificationItem, NotificationStatus } from "@/lib/types";
import { supabaseErrorMessage, supabaseHeaders, tryGetSupabasePublishableConfig } from "@/lib/supabase-rest";

type NotificationRow = Record<string, unknown>;
export type PublicItemsResult<T> = { items: T[]; error: string | null };
export type PublicItemResult<T> = { item: T | null; error: string | null };

function readText(row: NotificationRow, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return "";
}

function makeSlug(title: string, id: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "form"}-${id.slice(0, 8)}`;
}

export function mapNotificationRow(row: NotificationRow): NotificationItem {
  const id = readText(row, "id");
  const title = readText(row, "title");
  const description = readText(row, "short_description", "description");
  const date = readText(row, "published_at", "publish_date", "created_at");

  return {
    id,
    slug: readText(row, "slug") || makeSlug(title, id),
    title,
    organization: readText(row, "organization"),
    category: (readText(row, "category") || "Other") as NotificationCategory,
    shortDescription: description,
    description: readText(row, "description") || description,
    notificationDate: date.slice(0, 10),
    applicationStartDate: readText(row, "application_start_date", "start_date"),
    lastDate: readText(row, "last_date"),
    examDate: readText(row, "exam_date"),
    vacancy: readText(row, "vacancy"),
    eligibility: readText(row, "eligibility"),
    qualification: readText(row, "qualification"),
    ageLimit: readText(row, "age_limit"),
    applicationFee: readText(row, "application_fee"),
    notificationPdfUrl: readText(row, "notification_pdf_url", "official_pdf_url"),
    officialNotificationUrl: readText(row, "official_notification_url", "official_pdf_url"),
    officialWebsiteUrl: readText(row, "official_website_url"),
    applyOnlineUrl: readText(row, "apply_online_url"),
    serviceCharge: readText(row, "service_charge"),
    requiredDocuments: readText(row, "required_documents"),
    source: readText(row, "source") || "Official notification",
    fetchedDate: readText(row, "updated_at", "created_at").slice(0, 10),
    featured: row.featured === true,
    keepVisibleAfterLastDate: row.keep_visible_after_last_date === true,
    status: (readText(row, "status") || "published") as NotificationStatus,
    seoTitle: readText(row, "seo_title") || title,
    metaDescription: readText(row, "meta_description") || description,
  };
}

async function fetchPublishedRowsResult(params: Record<string, string>): Promise<PublicItemsResult<NotificationItem>> {
  const configuration = tryGetSupabasePublishableConfig();
  if (!configuration.config) return { items: [], error: configuration.error };

  const url = new URL(`${configuration.config.url}/rest/v1/notifications`);
  url.searchParams.set("select", "*");
  url.searchParams.set("status", "eq.published");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  try {
    const response = await fetch(url, {
      headers: supabaseHeaders(configuration.config.key),
      cache: "no-store",
    });
    if (!response.ok) {
      return { items: [], error: `Supabase notifications query failed: ${await supabaseErrorMessage(response)}.` };
    }
    const rows = await response.json() as NotificationRow[];
    return { items: rows.map(mapNotificationRow), error: null };
  } catch {
    return { items: [], error: "Could not connect to Supabase to load published notifications." };
  }
}

async function fetchPublishedRows(params: Record<string, string>): Promise<NotificationItem[]> {
  return (await fetchPublishedRowsResult(params)).items;
}

export function getLatestPublishedNotificationsResult(limit = 10): Promise<PublicItemsResult<NotificationItem>> {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 1000));
  return fetchPublishedRowsResult({ order: "published_at.desc.nullslast", limit: String(safeLimit) });
}

export function getLatestPublishedNotifications(limit = 10): Promise<NotificationItem[]> {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 1000));
  return fetchPublishedRows({
    order: "published_at.desc.nullslast",
    limit: String(safeLimit),
  });
}

export async function getAllPublishedNotifications(): Promise<NotificationItem[]> {
  const pageSize = 1000;
  const allItems: NotificationItem[] = [];
  let offset = 0;

  while (true) {
    const page = await fetchPublishedRows({
      order: "published_at.desc.nullslast",
      limit: String(pageSize),
      offset: String(offset),
    });
    allItems.push(...page);
    if (page.length < pageSize) return allItems;
    offset += pageSize;
  }
}

export async function getPublishedNotificationBySlug(slug: string): Promise<NotificationItem | null> {
  const items = await fetchPublishedRows({ slug: `eq.${slug}`, limit: "1" });
  return items[0] ?? null;
}

export async function getPublishedNotificationBySlugResult(slug: string): Promise<PublicItemResult<NotificationItem>> {
  const result = await fetchPublishedRowsResult({ slug: `eq.${slug}`, limit: "1" });
  return { item: result.items[0] ?? null, error: result.error };
}

export async function getPublishedNotificationByPdfUrl(notificationPdfUrl: string): Promise<NotificationItem | null> {
  const items = await fetchPublishedRows({ notification_pdf_url: `eq.${notificationPdfUrl}`, limit: "1" });
  return items[0] ?? null;
}
