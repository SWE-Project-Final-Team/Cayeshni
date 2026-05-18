const STORAGE_KEY = "cayeshni_post_auth_redirect";

/**
 * Returns a safe in-app path+query for post-login/register redirects, or null.
 * Rejects protocol-relative and absolute URLs to avoid open redirects.
 */
export function sanitizePostAuthPath(
  input: string | null | undefined
): string | null {
  if (input == null || typeof input !== "string") return null;
  let t = input.trim();
  try {
    t = decodeURIComponent(t);
  } catch {
    return null;
  }
  if (!t.startsWith("/")) return null;
  if (t.startsWith("//")) return null;
  const lower = t.toLowerCase();
  if (lower.startsWith("/\\")) return null;
  if (lower.includes("://")) return null;
  if (t.length > 768) return null;
  return t;
}

export function storePostAuthRedirect(path: string): void {
  const s = sanitizePostAuthPath(path);
  if (s) sessionStorage.setItem(STORAGE_KEY, s);
}

export function peekPostAuthRedirect(): string | null {
  return sanitizePostAuthPath(sessionStorage.getItem(STORAGE_KEY));
}

export function consumePostAuthRedirect(): string | null {
  const v = peekPostAuthRedirect();
  if (v) sessionStorage.removeItem(STORAGE_KEY);
  return v;
}

export function clearPostAuthRedirect(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Prefer `next` query param, then stored path, then dashboard. Clears storage when used. */
export function resolvePostAuthDestination(): string {
  if (typeof window === "undefined") return "/dashboard";
  const fromQuery = sanitizePostAuthPath(
    new URLSearchParams(window.location.search).get("next")
  );
  const fromStorage = consumePostAuthRedirect();
  return fromQuery ?? fromStorage ?? "/dashboard";
}
