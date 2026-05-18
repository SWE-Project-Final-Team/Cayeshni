export function parseEmailConfirmed(accessToken: string): boolean {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return false;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const payload = JSON.parse(atob(b64 + pad)) as Record<string, unknown>;
    const v = payload.email_confirmed;
    return v === true || v === "true";
  } catch {
    return false;
  }
}
