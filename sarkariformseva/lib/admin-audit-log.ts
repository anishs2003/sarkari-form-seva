import { supabaseErrorMessage, supabaseHeaders, tryGetSupabaseServerConfig } from "@/lib/supabase-rest";

export type FormAuditAction =
  | "Form Created"
  | "Form Edited"
  | "Form Published"
  | "Form Unpublished"
  | "Form Deleted"
  | "PDF Uploaded"
  | "PDF Removed"
  | "Service Charge Changed";

type AuditEvent = { action: FormAuditAction; metadata?: Record<string, unknown> };

export async function recordFormAuditEvents(adminId: string, formId: string, events: AuditEvent[]): Promise<boolean> {
  if (!events.length) return true;
  const database = tryGetSupabaseServerConfig();
  if (!database.config) return false;
  const { url, key } = database.config;

  try {
    const response = await fetch(`${url}/rest/v1/audit_logs`, {
      method: "POST",
      headers: supabaseHeaders(key, {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      }),
      body: JSON.stringify(events.map(({ action, metadata }) => ({
        admin_id: adminId,
        actor_id: adminId,
        action,
        form_id: formId,
        entity_type: "form",
        entity_id: formId,
        metadata: metadata ?? {},
      }))),
      cache: "no-store",
    });
    if (!response.ok) console.error("Form audit log write failed:", await supabaseErrorMessage(response));
    return response.ok;
  } catch {
    console.error("Form audit log write failed because Supabase is unavailable.");
    return false;
  }
}
