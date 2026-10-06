export type SafeUrlResult = { href: string; state: "valid" } | { href: null; state: "missing" | "invalid" };

export function validateExternalUrl(value: string | undefined): SafeUrlResult {
  const candidate = value?.trim();
  if (!candidate) return { href: null, state: "missing" };
  if (candidate.startsWith("//")) return { href: null, state: "invalid" };

  if (candidate.startsWith("/")) {
    return /^\/api\/notification-pdfs\/[a-zA-Z0-9_-]+\.pdf$/.test(candidate)
      ? { href: candidate, state: "valid" }
      : { href: null, state: "invalid" };
  }

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:"
      ? { href: url.toString(), state: "valid" }
      : { href: null, state: "invalid" };
  } catch {
    return { href: null, state: "invalid" };
  }
}

export function getSafeExternalUrl(value: string | undefined): string | null {
  const result = validateExternalUrl(value);
  return result.state === "valid" ? result.href : null;
}
