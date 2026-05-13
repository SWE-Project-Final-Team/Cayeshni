import { API_BASE } from "./config";

/** Read the body once, then parse JSON when valid; avoids "body stream already read". */
export async function readBodyAsJsonOrText(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let refreshAccessTokenHandler: (() => Promise<string | null>) | null = null;
let refreshInFlight: Promise<string | null> | null = null;

/**
 * Register the app refresh routine (e.g. POST /api/auth/refresh with cookies).
 * Set to `null` on unmount. Used by `apiJson` / `apiMultipartJson` on 401.
 */
export function setAccessTokenRefreshHandler(
  handler: (() => Promise<string | null>) | null
): void {
  refreshAccessTokenHandler = handler;
}

function pathWithoutQuery(path: string): string {
  const q = path.indexOf("?");
  return q === -1 ? path : path.slice(0, q);
}

/** 401 on these routes is not fixed by refresh (wrong password, public token flows, etc.). */
const AUTH_401_NO_REFRESH = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/confirm-email",
]);

function mayRefreshOn401(path: string): boolean {
  return !AUTH_401_NO_REFRESH.has(pathWithoutQuery(path));
}

/** Single-flight: concurrent 401s await the same refresh. */
async function refreshAccessTokenCoalesced(): Promise<string | null> {
  if (!refreshAccessTokenHandler) return null;
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessTokenHandler().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function parseJsonSuccessBody<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export async function apiJson<T>(
  path: string,
  init: {
    method?: string;
    accessToken?: string | null;
    json?: unknown;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const method = init.method ?? "GET";
  const signal = init.signal;

  const buildHeaders = (bearer: string | null | undefined) => {
    const headers = new Headers();
    if (init.json !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    if (bearer) {
      headers.set("Authorization", `Bearer ${bearer}`);
    }
    return headers;
  };

  const doFetch = (bearer: string | null | undefined) =>
    fetch(`${API_BASE}${path}`, {
      method,
      headers: buildHeaders(bearer),
      credentials: "include",
      body: init.json !== undefined ? JSON.stringify(init.json) : undefined,
      signal,
    });

  let bearer: string | null | undefined = init.accessToken ?? undefined;
  let res = await doFetch(bearer);

  if (
    res.status === 401 &&
    mayRefreshOn401(path) &&
    refreshAccessTokenHandler &&
    !signal?.aborted
  ) {
    const newToken = await refreshAccessTokenCoalesced();
    if (newToken) {
      bearer = newToken;
      res = await doFetch(bearer);
    }
  }

  if (!res.ok) {
    const body = await readBodyAsJsonOrText(res);
    throw new ApiError("Request failed", res.status, body);
  }

  return parseJsonSuccessBody<T>(res);
}

/** POST multipart (e.g. profile picture). Do not set Content-Type — browser sets boundary. */
export async function apiMultipartJson<T>(
  path: string,
  formData: FormData,
  accessToken: string,
  signal?: AbortSignal
): Promise<T> {
  const doFetch = (bearer: string) =>
    fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
      credentials: "include",
      body: formData,
      signal,
    });

  let token = accessToken;
  let res = await doFetch(token);

  if (
    res.status === 401 &&
    mayRefreshOn401(path) &&
    refreshAccessTokenHandler &&
    !signal?.aborted
  ) {
    const newToken = await refreshAccessTokenCoalesced();
    if (newToken) {
      token = newToken;
      res = await doFetch(token);
    }
  }

  if (!res.ok) {
    const body = await readBodyAsJsonOrText(res);
    throw new ApiError("Request failed", res.status, body);
  }

  return parseJsonSuccessBody<T>(res);
}

export function mediaUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const p = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${API_BASE}${p}`;
}
