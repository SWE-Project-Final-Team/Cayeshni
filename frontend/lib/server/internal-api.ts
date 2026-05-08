import { normalizeApiBaseUrl } from "@/lib/utils/env";

/**
 * Base URL for server-side calls to the ASP.NET API (Route Handlers / proxy).
 * In Docker, set INTERNAL_API_URL (e.g. http://server:8080) so the container can reach the API.
 */
export function getInternalApiBase(): string {
  const raw =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";
  return normalizeApiBaseUrl(raw);
}
