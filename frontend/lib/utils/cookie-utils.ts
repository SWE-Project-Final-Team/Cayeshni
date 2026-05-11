function isProduction(): boolean {
  if (typeof window === "undefined") return process.env.NODE_ENV === "production";
  return window.location.protocol === "https:";
}

export function setCookie(name: string, value: string, days = 7, secure?: boolean): void {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  const shouldSecure = secure !== undefined ? secure : isProduction();
  const secureFlag = shouldSecure ? "; Secure" : "";
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function clearAuthCookies(): void {
  ["session"].forEach(deleteCookie);
}
