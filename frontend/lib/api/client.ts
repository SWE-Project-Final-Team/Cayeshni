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

export async function apiJson<T>(
  path: string,
  init: {
    method?: string;
    accessToken?: string | null;
    json?: unknown;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const headers = new Headers();
  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (init.accessToken) {
    headers.set("Authorization", `Bearer ${init.accessToken}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method ?? "GET",
    headers,
    credentials: "include",
    body: init.json !== undefined ? JSON.stringify(init.json) : undefined,
    signal: init.signal,
  });

  if (!res.ok) {
    const body = await readBodyAsJsonOrText(res);
    throw new ApiError("Request failed", res.status, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

/** POST multipart (e.g. profile picture). Do not set Content-Type — browser sets boundary. */
export async function apiMultipartJson<T>(
  path: string,
  formData: FormData,
  accessToken: string
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const body = await readBodyAsJsonOrText(res);
    throw new ApiError("Request failed", res.status, body);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export function mediaUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const p = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${API_BASE}${p}`;
}
