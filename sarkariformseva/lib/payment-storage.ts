import { getSupabaseServerConfig, supabaseHeaders } from "@/lib/supabase-rest";

const storageBucket = "documents";

function getSupabaseConfig() {
  return getSupabaseServerConfig();
}

function encodedPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

export function isPaymentScreenshotPath(path: string): boolean {
  return /^payment-screenshots\/[a-zA-Z0-9_-]+\.(jpg|png|webp|pdf)$/.test(path);
}

export function isApplicationDocumentPath(path: string): boolean {
  return /^application-documents\/[a-f0-9-]{36}\/[a-zA-Z0-9_-]+\.(jpg|png|webp|pdf)$/.test(path);
}

export async function uploadPaymentScreenshot(path: string, bytes: Uint8Array, contentType: string): Promise<Response> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase Storage is not configured.");
  const body = new Uint8Array(bytes.byteLength);
  body.set(bytes);
  return fetch(`${config.url}/storage/v1/object/${storageBucket}/${encodedPath(path)}`, {
    method: "POST",
    headers: supabaseHeaders(config.key, {
      "Content-Type": contentType,
      "x-upsert": "false",
    }),
    body,
    cache: "no-store",
  });
}

export async function deletePaymentScreenshot(path: string): Promise<void> {
  const config = getSupabaseConfig();
  if (!config) return;
  await fetch(`${config.url}/storage/v1/object/${storageBucket}`, {
    method: "DELETE",
      headers: supabaseHeaders(config.key, {
      "Content-Type": "application/json",
      }),
    body: JSON.stringify({ prefixes: [path] }),
    cache: "no-store",
  });
}

export async function createPaymentScreenshotUrl(path: string): Promise<string> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase Storage is not configured.");
  const response = await fetch(`${config.url}/storage/v1/object/sign/${storageBucket}/${encodedPath(path)}`, {
    method: "POST",
    headers: supabaseHeaders(config.key, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ expiresIn: 300, download: false }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Could not create a payment screenshot link.");
  const result = await response.json() as { signedURL?: string };
  if (!result.signedURL) throw new Error("Storage returned an invalid screenshot link.");
  return new URL(result.signedURL, config.url).toString();
}

export async function uploadApplicationDocument(path: string, bytes: Uint8Array, contentType: string): Promise<Response> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase Storage is not configured.");
  const body = new Uint8Array(bytes.byteLength);
  body.set(bytes);
  return fetch(`${config.url}/storage/v1/object/${storageBucket}/${encodedPath(path)}`, {
    method: "POST",
    headers: supabaseHeaders(config.key, {
      "Content-Type": contentType,
      "x-upsert": "false",
    }),
    body,
    cache: "no-store",
  });
}

export async function deleteApplicationDocument(path: string): Promise<void> {
  const config = getSupabaseConfig();
  if (!config) return;
  await fetch(`${config.url}/storage/v1/object/${storageBucket}`, {
    method: "DELETE",
    headers: supabaseHeaders(config.key, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ prefixes: [path] }),
    cache: "no-store",
  });
}

export async function createApplicationDocumentUrl(path: string): Promise<string> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase Storage is not configured.");
  const response = await fetch(`${config.url}/storage/v1/object/sign/${storageBucket}/${encodedPath(path)}`, {
    method: "POST",
    headers: supabaseHeaders(config.key, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ expiresIn: 300, download: false }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Could not create a private document link.");
  const result = await response.json() as { signedURL?: string };
  if (!result.signedURL) throw new Error("Storage returned an invalid document link.");
  return new URL(result.signedURL, config.url).toString();
}
