import "server-only";

import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { getSupabaseServerConfig } from "@/lib/supabase-rest";

export type AdminSessionClaims = { userId: string; email: string; issuedAt: number; expiresAt: number };

function signingKey(): string {
  return createHmac("sha256", getSupabaseServerConfig().key).update("sarkari-form-seva-admin-session-v1").digest("base64url");
}

export function verifyAdminPassword(password: string, storedHash: string): boolean {
  const [algorithm, saltText, digestText, extra] = storedHash.split(":");
  if (algorithm !== "scrypt" || !saltText || !digestText || extra !== undefined) return false;
  try {
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(digestText, "base64url");
    if (salt.length < 16 || expected.length !== 64) return false;
    const actual = scryptSync(password, salt, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function createAdminSessionToken(userId: string, email: string): { token: string; maxAge: number } {
  const issuedAt = Math.floor(Date.now() / 1000);
  const maxAge = 60 * 60 * 8;
  const claims: AdminSessionClaims = { userId, email, issuedAt, expiresAt: issuedAt + maxAge };
  const encodedClaims = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", signingKey()).update(encodedClaims).digest("base64url");
  return { token: `${encodedClaims}.${signature}`, maxAge };
}

export function verifyAdminSessionToken(token: string): AdminSessionClaims | null {
  const [encodedClaims, suppliedSignature, extra] = token.split(".");
  if (!encodedClaims || !suppliedSignature || extra !== undefined) return null;
  try {
    const expectedSignature = createHmac("sha256", signingKey()).update(encodedClaims).digest();
    const actualSignature = Buffer.from(suppliedSignature, "base64url");
    if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) return null;
    const claims = JSON.parse(Buffer.from(encodedClaims, "base64url").toString("utf8")) as Partial<AdminSessionClaims>;
    if (typeof claims.userId !== "string" || !/^[0-9a-f-]{36}$/i.test(claims.userId)) return null;
    if (typeof claims.email !== "string" || typeof claims.expiresAt !== "number" || claims.expiresAt <= Date.now() / 1000) return null;
    if (typeof claims.issuedAt !== "number" || claims.issuedAt > Date.now() / 1000 + 60) return null;
    return claims as AdminSessionClaims;
  } catch {
    return null;
  }
}