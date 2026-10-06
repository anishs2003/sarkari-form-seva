import { cookies } from "next/headers";
import { adminSessionCookieName } from "@/lib/admin-auth-cookies";
import { verifyAdminSessionToken } from "@/lib/admin-session";
import { getSupabaseServerConfig, supabaseErrorMessage, supabaseHeaders } from "@/lib/supabase-rest";

export type AdminRole = "admin" | "super_admin" | "staff";
type AdminAuthorization =
  | { authorized: true; userId: string; email: string; role: AdminRole }
  | { authorized: false; status: 401 | 403 | 503; error: string };

type AdminUser = { id: string; email: string; role?: string };
const allowedRoles = new Set<AdminRole>(["admin", "super_admin", "staff"]);

function normalizedRole(value: unknown): AdminRole | null {
  const role = typeof value === "string" ? value.toLowerCase() : "";
  return allowedRoles.has(role as AdminRole) ? role as AdminRole : null;
}

async function readRows<T>(url: URL): Promise<T[]> {
  const config = getSupabaseServerConfig();
  const response = await fetch(url, { headers: supabaseHeaders(config.key), cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase role lookup failed: ${await supabaseErrorMessage(response)}.`);
  return await response.json() as T[];
}

export async function getAdminRoleForUser(userId: string): Promise<AdminRole | null> {
  const config = getSupabaseServerConfig();
  const adminsUrl = new URL(`${config.url}/rest/v1/admins`);
  adminsUrl.searchParams.set("select", "role");
  adminsUrl.searchParams.set("user_id", `eq.${userId}`);
  adminsUrl.searchParams.set("limit", "1");
  try {
    const admins = await readRows<{ role?: string }>(adminsUrl);
    const adminRole = normalizedRole(admins[0]?.role);
    if (adminRole) return adminRole;
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("(PGRST205)")) throw error;
  }

  const usersUrl = new URL(`${config.url}/rest/v1/users`);
  usersUrl.searchParams.set("select", "role");
  usersUrl.searchParams.set("id", `eq.${userId}`);
  usersUrl.searchParams.set("limit", "1");
  const users = await readRows<{ role?: string }>(usersUrl);
  return normalizedRole(users[0]?.role);
}

export async function getAdminUserByEmail(email: string): Promise<{ id: string; email: string; role: AdminRole } | null> {
  const config = getSupabaseServerConfig();
  const url = new URL(`${config.url}/rest/v1/users`);
  url.searchParams.set("select", "id,email,role");
  url.searchParams.set("email", `eq.${email}`);
  url.searchParams.set("limit", "1");
  const users = await readRows<AdminUser>(url);
  const user = users[0];
  if (!user || user.email.toLowerCase() !== email.toLowerCase()) return null;
  const role = await getAdminRoleForUser(user.id);
  return role ? { id: user.id, email: user.email, role } : null;
}

export async function getCurrentAdmin(): Promise<AdminAuthorization> {
  try {
    getSupabaseServerConfig();
  } catch (error) {
    return { authorized: false, status: 503, error: error instanceof Error ? error.message : "Admin authentication is not configured." };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;
  if (!token) return { authorized: false, status: 401, error: "Admin sign-in required." };
  const session = verifyAdminSessionToken(token);
  if (!session) return { authorized: false, status: 401, error: "Admin session is invalid or expired." };

  try {
    const role = await getAdminRoleForUser(session.userId);
    if (!role) return { authorized: false, status: 403, error: "Access Denied" };
    return { authorized: true, userId: session.userId, email: session.email, role };
  } catch (error) {
    return { authorized: false, status: 503, error: error instanceof Error ? error.message : "Could not verify admin authorization." };
  }
}

export async function authorizeAdminRequest(request: Request): Promise<AdminAuthorization> {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return { authorized: false, status: 403, error: "Cross-origin admin requests are not allowed." };
      }
    } catch {
      return { authorized: false, status: 403, error: "Invalid request origin." };
    }
  }
  return getCurrentAdmin();
}
