import "server-only";

export type SupabaseConfig = { url: string; key: string };

export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigurationError";
  }
}

function configuredUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!rawUrl) throw new SupabaseConfigurationError("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL.");
  try {
    const parsed = new URL(rawUrl);
    if (!(["https:", "http:"].includes(parsed.protocol)) || parsed.username || parsed.password) throw new Error();
    return parsed.toString().replace(/\/$/, "");
  } catch {
    throw new SupabaseConfigurationError("NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL.");
  }
}

export function getSupabasePublishableConfig(): SupabaseConfig {
  const url = configuredUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!key) throw new SupabaseConfigurationError("Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  if (!key.startsWith("sb_publishable_")) throw new SupabaseConfigurationError("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must use the sb_publishable_ format.");
  return { url, key };
}

export function tryGetSupabasePublishableConfig(): { config: SupabaseConfig; error: null } | { config: null; error: string } {
  try {
    return { config: getSupabasePublishableConfig(), error: null };
  } catch (error) {
    return { config: null, error: error instanceof Error ? error.message : "Supabase public configuration is invalid." };
  }
}

export function getSupabaseServerConfig(): SupabaseConfig {
  const url = configuredUrl();
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!key) throw new SupabaseConfigurationError("Missing required server environment variable: SUPABASE_SECRET_KEY.");
  if (!key.startsWith("sb_secret_")) throw new SupabaseConfigurationError("SUPABASE_SECRET_KEY must use the sb_secret_ format.");
  return { url, key };
}

export function tryGetSupabaseServerConfig(): { config: SupabaseConfig; error: null } | { config: null; error: string } {
  try {
    return { config: getSupabaseServerConfig(), error: null };
  } catch (error) {
    return { config: null, error: error instanceof Error ? error.message : "Supabase server configuration is invalid." };
  }
}

export function supabaseHeaders(key: string, extra: Record<string, string> = {}) {
  return { apikey: key, ...extra };
}

export async function supabaseErrorMessage(response: Response): Promise<string> {
  const body = await response.json().catch(() => null) as { code?: unknown; message?: unknown; hint?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message : `HTTP ${response.status}`;
  const code = typeof body?.code === "string" ? ` (${body.code})` : "";
  const hint = typeof body?.hint === "string" ? ` ${body.hint}` : "";
  return `${message}${code}${hint}`;
}