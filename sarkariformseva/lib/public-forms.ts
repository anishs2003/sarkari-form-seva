import type { NotificationCategory, NotificationItem, NotificationStatus } from "@/lib/types";
import { supabaseErrorMessage, supabaseHeaders, tryGetSupabasePublishableConfig } from "@/lib/supabase-rest";
import type { PublicItemResult, PublicItemsResult } from "@/lib/public-notifications";

type FormRow = Record<string, unknown>;

function readText(row: FormRow, ...keys: string[]): string {
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

export function mapFormRow(row: FormRow): NotificationItem {
  const id = readText(row, "id");
  const title = readText(row, "title", "name");
  const description = readText(row, "description", "short_description");
  const publishedDate = readText(row, "published_at", "created_at");
  return {
    id,
    slug: readText(row, "slug") || makeSlug(title, id),
    title,
    organization: readText(row, "organization"),
    category: (readText(row, "category") || "Other") as NotificationCategory,
    shortDescription: readText(row, "short_description") || description,
    description,
    notificationDate: publishedDate.slice(0, 10),
    applicationStartDate: readText(row, "start_date", "application_start_date"),
    lastDate: readText(row, "last_date"),
    examDate: readText(row, "exam_date"),
    vacancy: readText(row, "vacancy"),
    qualification: readText(row, "qualification"),
    eligibility: readText(row, "eligibility"),
    ageLimit: readText(row, "age_limit"),
    applicationFee: readText(row, "application_fee"),
    serviceCharge: readText(row, "service_charge"),
    requiredDocuments: readText(row, "required_documents"),
    notificationPdfUrl: readText(row, "notification_pdf_url"),
    officialNotificationUrl: readText(row, "official_notification_url"),
    officialWebsiteUrl: readText(row, "official_website_url"),
    applyOnlineUrl: readText(row, "apply_online_url"),
    featured: row.featured === true,
    keepVisibleAfterLastDate: row.keep_visible_after_last_date === true,
    source: readText(row, "source") || "Admin entry",
    fetchedDate: readText(row, "updated_at", "created_at").slice(0, 10),
    status: (readText(row, "status") || "published") as NotificationStatus,
    seoTitle: readText(row, "seo_title") || title,
    metaDescription: readText(row, "meta_description") || description,
  };
}

async function fetchPublishedFormsResult(params: Record<string, string>): Promise<PublicItemsResult<NotificationItem>> {
  const configuration = tryGetSupabasePublishableConfig();
  if (!configuration.config) return { items: [], error: configuration.error };

  const url = new URL(`${configuration.config.url}/rest/v1/forms`);
  url.searchParams.set("select", "*");
  url.searchParams.set("status", "eq.published");
  url.searchParams.set("active", "eq.true");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  try {
    const response = await fetch(url, { headers: supabaseHeaders(configuration.config.key), cache: "no-store" });
    if (!response.ok) return { items: [], error: `Supabase forms query failed: ${await supabaseErrorMessage(response)}.` };
    const rows = await response.json() as FormRow[];
    return { items: rows.map(mapFormRow), error: null };
  } catch {
    return { items: [], error: "Could not connect to Supabase to load published forms." };
  }
}

export function getLatestPublishedFormsResult(limit = 100): Promise<PublicItemsResult<NotificationItem>> {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 1000));
  return fetchPublishedFormsResult({ order: "published_at.desc.nullslast", limit: String(safeLimit) });
}

export async function getAllPublishedForms(): Promise<NotificationItem[]> {
  const result = await getLatestPublishedFormsResult(1000);
  return result.items;
}

export async function getPublishedFormBySlug(slug: string): Promise<NotificationItem | null> {
  const result = await fetchPublishedFormsResult({ slug: `eq.${slug}`, limit: "1" });
  return result.items[0] ?? null;
}

export async function getPublishedFormBySlugResult(slug: string): Promise<PublicItemResult<NotificationItem>> {
  const result = await fetchPublishedFormsResult({ slug: `eq.${slug}`, limit: "1" });
  return { item: result.items[0] ?? null, error: result.error };
}
