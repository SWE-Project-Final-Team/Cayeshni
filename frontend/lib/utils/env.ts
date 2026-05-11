const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

export function normalizeApiBaseUrl(url: string): string {
  const base = url.replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

export function getEnv(key: string, defaultValue?: string): string {
  if (key === "API_URL") {
    const raw =
      NEXT_PUBLIC_API_URL || defaultValue || "http://localhost:8080";
    return normalizeApiBaseUrl(raw);
  }
  const value = NEXT_PUBLIC_API_URL;
  return value || defaultValue || "";
}

export const API_BASE_URL = normalizeApiBaseUrl(
  NEXT_PUBLIC_API_URL || "http://localhost:8080"
);
