import { getSupabaseServerConfig, supabaseHeaders } from "@/lib/supabase-rest";

const storageBucket = "documents";

function getSupabaseConfig() {
  return getSupabaseServerConfig();
}

export function isNotificationPdfObjectPath(path: string): boolean {
  return /^notification-pdfs\/[a-zA-Z0-9_-]+\.pdf$/.test(path);
}

function encodeObjectPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function uploadNotificationPdf(path: string, bytes: Buffer): Promise<Response> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase Storage is not configured.");
  return fetch(`${config.url}/storage/v1/object/${storageBucket}/${encodeObjectPath(path)}`, {
    method: "POST",
    headers: supabaseHeaders(config.key, {
      "Content-Type": "application/pdf",
      "x-upsert": "true",
    }),
    body: new Uint8Array(bytes),
    cache: "no-store",
  });
}

export async function removeNotificationPdf(path: string): Promise<Response> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase Storage is not configured.");
  return fetch(`${config.url}/storage/v1/object/${storageBucket}`, {
    method: "DELETE",
    headers: supabaseHeaders(config.key, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ prefixes: [path] }),
    cache: "no-store",
  });
}

export async function createNotificationPdfSignedUrl(path: string): Promise<string> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase Storage is not configured.");
  const response = await fetch(`${config.url}/storage/v1/object/sign/${storageBucket}/${encodeObjectPath(path)}`, {
    method: "POST",
    headers: supabaseHeaders(config.key, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ expiresIn: 60, download: true }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Could not create a notification download link.");
  const result = await response.json() as { signedURL?: string };
  if (!result.signedURL) throw new Error("Storage returned an invalid download link.");
  return new URL(result.signedURL, config.url).toString();
}
