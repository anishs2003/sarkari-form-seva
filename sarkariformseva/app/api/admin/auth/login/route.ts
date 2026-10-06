import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { getAdminUserByEmail } from "@/lib/admin-api-auth";
import { adminSessionCookieName } from "@/lib/admin-auth-cookies";
import { createAdminSessionToken, verifyAdminPassword } from "@/lib/admin-session";
import { getSupabaseServerConfig, SupabaseConfigurationError } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!adminEmail || !passwordHash) return NextResponse.json({ error: "Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD_HASH on the server." }, { status: 503 });
  try { getSupabaseServerConfig(); } catch (error) {
    return NextResponse.json({ error: error instanceof SupabaseConfigurationError ? error.message : "Supabase server configuration is invalid." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ error: "Enter your admin email and password." }, { status: 400 });

  try {
    const expectedEmail = createHash("sha256").update(adminEmail).digest();
    const suppliedEmail = createHash("sha256").update(email).digest();
    const emailMatches = timingSafeEqual(expectedEmail, suppliedEmail);
    const passwordMatches = verifyAdminPassword(password, passwordHash);
    if (!emailMatches || !passwordMatches) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const account = await getAdminUserByEmail(adminEmail);
    if (!account) return NextResponse.json({ error: "Access Denied. This email is not assigned an admin or staff role." }, { status: 403 });
    const session = createAdminSessionToken(account.id, account.email);
    const response = NextResponse.json({ success: true, user: { email: account.email, role: account.role } });
    response.cookies.set(adminSessionCookieName, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: session.maxAge,
    });
    return response;
  } catch (error) {
    const message = error instanceof SupabaseConfigurationError
      ? error.message
      : error instanceof Error ? error.message : "Admin sign-in failed due to an unexpected server error.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
