# Auth, Proxy & Token Refresh — Reusable Guide (single-role)

This document explains the JWT auth flow, the Next.js proxy (formerly `middleware.ts`), and the
failed-request retry/refresh loop used in this project, in a form you can copy into a **new
Next.js 16 + React 19 + Zustand + Axios** app **without internationalization (i18n) and without
roles** — the app is single-role: every logged-in account is just "user".

All snippets below are stripped of i18n (`next-intl`, `[locale]`, `Accept-Language`,
locale-prefixed redirects) and roles (`UserRole`, `ROLE_ROUTES`, `userRole` cookie, role mapping,
role-based redirects, role selection modal).

---

## 1. Mental model

```
        ┌─────────────────────────────┐
        │           Browser            │
        │                              │
        │  Zustand store (in-memory)   │  <-- access token lives here
        │   accessToken: "ey..."       │
        │                              │
        │  Cookies (document.cookie)   │
        │   session=active             │  <-- non-secret flag for the proxy
        │                              │
        │  Cookies (httpOnly, set by   │
        │  backend, JS cannot read)    │
        │   refresh=<JWT refresh>      │  <-- only sent to /api/token/refresh/
        └──────────────┬───────────────┘
                       │ axios (withCredentials: true)
                       │   Authorization: Bearer <accessToken>   (added per request)
                       ▼
        ┌─────────────────────────────┐
        │           Backend            │
        │  POST /api/v1/token/         │  -> { access }, sets httpOnly refresh cookie
        │  POST /api/v1/token/refresh/ │  -> { access }            (reads httpOnly cookie)
        │  POST /api/v1/logout/        │  -> clears httpOnly cookie
        │  GET  /api/v1/users/me/      │  -> validates Bearer on every call
        └─────────────────────────────┘
```

Key invariants:

- **Access token** = short-lived, JS-readable, kept **only in memory** (Zustand). Lost on hard
  refresh — that's intentional.
- **Refresh token** = long-lived, **httpOnly cookie**, set by the backend, JS cannot read it.
  Path-restricted to `/api/token/refresh/` so it's only sent there.
- **`session` cookie** = a plain non-httpOnly flag (`"active"`) used by the proxy to decide
  *whether to redirect to /login*. It is **not** an auth credential. The backend never trusts it.
- After a hard refresh: the in-memory access token is gone, but the httpOnly refresh cookie is
  still there, so on the first 401 (or via `tryRestoreSession`) we silently mint a new access
  token and continue.

---

## 2. File layout

For a brand-new project, drop these files in:

```
src/
├── proxy.ts                              # Next.js 16 proxy (was middleware.ts)
├── store/
│   └── auth.store.ts                     # Zustand auth state (in-memory access token)
├── hooks/
│   └── useAuth.ts                        # Loads /me on boot, exposes logout()
├── lib/
│   ├── api/
│   │   ├── axios.ts                      # Axios instance + request/response interceptors
│   │   └── auth.api.ts                   # login(), logout(), refreshToken(), me(), tryRestoreSession()
│   └── utils/
│       ├── env.ts                        # Reads NEXT_PUBLIC_API_URL, normalizes /api suffix
│       └── cookie-utils.ts               # setCookie / getCookie / deleteCookie (Secure auto)
└── types/
    └── user.ts                           # User / profile types
```

Plus at the project root:

```
.env.local           # NEXT_PUBLIC_API_URL=http://localhost
next.config.ts       # exposes NEXT_PUBLIC_API_URL to the client bundle
```

> **Naming note:** In Next.js 16, `middleware.ts` was renamed to `proxy.ts`. If you're on Next.js
> ≤ 15, use `src/middleware.ts` and rename the exported function `proxy` to `middleware` — the
> logic is identical.

---

## 3. Environment & API base URL

### `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost
```

The base URL deliberately does **not** include `/api` — the env helper appends it.

### `next.config.ts`

```ts
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "",
  },
};

export default nextConfig;
```

### `src/lib/utils/env.ts`

```ts
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

function normalizeApiBaseUrl(url: string): string {
  const base = url.replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
}

export function getEnv(key: string, defaultValue?: string): string {
  if (key === "API_URL") {
    const raw = NEXT_PUBLIC_API_URL || defaultValue || "http://localhost/api";
    return normalizeApiBaseUrl(raw);
  }
  const isBrowser = typeof window !== "undefined";
  const value = isBrowser
    ? process.env[`NEXT_PUBLIC_${key}`]
    : process.env[`NEXT_PUBLIC_${key}`] || process.env[key];
  return value || defaultValue || "";
}

export const API_BASE_URL = normalizeApiBaseUrl(NEXT_PUBLIC_API_URL || "http://localhost/api");
```

> Why static-only: Next.js inlines `process.env.NEXT_PUBLIC_*` references **at build time** only
> when accessed statically. Dynamic access (`process.env[\`NEXT_PUBLIC_${k}\`]`) does not get
> inlined for the client bundle, so we keep `NEXT_PUBLIC_API_URL` as a static reference.

---

## 4. Cookie utilities — `src/lib/utils/cookie-utils.ts`

```ts
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
```

**Security rules enforced here:**

- Never store tokens in `localStorage` (XSS-readable).
- The `Secure` flag is auto-detected from HTTPS so dev (`http://localhost`) still works.
- `SameSite=Lax` is the safe default for navigation flows.

---

## 5. Zustand auth store — `src/store/auth.store.ts`

The store holds the **in-memory access token** plus user profile + permissions. It deliberately
does **not** persist anything to `localStorage`.

```ts
import { create } from "zustand";
import type { User } from "@/types/user";
import { deleteCookie } from "@/lib/utils/cookie-utils";

interface AuthState {
  user: User | null;
  permissions: string[];
  isLoading: boolean;
  hasHydrated: boolean;
  accessToken: string | null;
  setUser: (user: User | null) => void;
  setPermissions: (permissions: string[]) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  permissions: [],
  isLoading: false,
  hasHydrated: false,
  accessToken: null,
  setUser: (user) => set({ user }),
  setPermissions: (permissions) => set({ permissions }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasHydrated: (hasHydrated) => set({ hasHydrated }),
  setAccessToken: (accessToken) => set({ accessToken }),
  logout: () => {
    if (typeof document !== "undefined") {
      deleteCookie("session");
    }
    set({
      user: null,
      permissions: [],
      isLoading: false,
      hasHydrated: false,
      accessToken: null,
    });
  },
}));

export const useUser = () => useAuthStore((s) => s.user);
export const usePermissions = () => useAuthStore((s) => s.permissions);
export const useIsLoading = () => useAuthStore((s) => s.isLoading);
export const useAccessToken = () => useAuthStore((s) => s.accessToken);
```

> **Don't** combine selectors into one object selector — that re-creates a new reference each
> render and triggers infinite loops with `useEffect`. Always use the per-field selectors above.

---

## 6. Axios instance + interceptors — `src/lib/api/axios.ts`

This is the heart of the failed-request handling. Two interceptors:

### Request interceptor — what it does
1. Prefixes relative URLs with the API version (`v1/...`) unless an explicit version is given.
2. Reads the in-memory access token from Zustand and attaches `Authorization: Bearer <token>`.

### Response interceptor — what it does
1. On `401` with a retriable request (not already retried):
   - If a refresh is **already in flight**, the request is queued (so we never call
     `/token/refresh/` more than once at a time).
   - Otherwise we set `_retry`, call `/v1/token/refresh/` (refresh cookie is sent automatically
     because of `withCredentials`), drain the queue with the new token, and replay the original
     request with `Authorization: Bearer <newAccess>`.
   - If refresh itself fails → reject every queued request, clear auth, redirect to `/login`.
2. Any other error is passed through with `Promise.reject(error)` (handle in UI or callers).

```ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getEnv } from "../utils/env";
import { useAuthStore } from "@/store/auth.store";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

export const API_VERSION = "v1";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: getEnv("API_URL", "http://localhost/api"),
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // <- required for httpOnly refresh cookie
});

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.url && !config.url.startsWith("http") && !config.url.startsWith("//")) {
    const path = config.url.replace(/^\//, "");
    config.url = /^v\d+\//.test(path) ? path : `${API_VERSION}/${path}`;
  }
  if (typeof window !== "undefined") {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    const shouldTryRefresh =
      status === 401 && originalRequest && !originalRequest._retry;

    if (shouldTryRefresh) {
      if (typeof window === "undefined") return Promise.reject(error);

      // 1) Already refreshing — queue this request behind the in-flight refresh
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then((token) => {
            if (originalRequest.headers && typeof token === "string") {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          });
      }

      // 2) First failure — kick off the refresh
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use raw axios (NOT axiosInstance) to skip our own interceptors and avoid recursion
        const refreshResponse = await axios.post<{ access: string }>(
          `${getEnv("API_URL", "http://localhost/api")}/${API_VERSION}/token/refresh/`,
          {}, // empty body — refresh token comes from the httpOnly cookie
          { headers: { "Content-Type": "application/json" }, withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.access;
        useAuthStore.getState().setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);
        isRefreshing = false;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh itself failed — give up, evict everyone, redirect to login
        processQueue(refreshError, null);
        isRefreshing = false;
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

export function getAxiosErrorMessage(error: unknown, fallback: string) {
  const err = error as AxiosError<unknown> | undefined;
  const data = err?.response?.data;
  const pick = (k: string) =>
    data && typeof data === "object" && k in data ? (data as Record<string, unknown>)[k] : undefined;
  return (
    (typeof pick("error")   === "string" ? (pick("error")   as string) : undefined) ||
    (typeof pick("detail")  === "string" ? (pick("detail")  as string) : undefined) ||
    (typeof pick("message") === "string" ? (pick("message") as string) : undefined) ||
    (error instanceof Error ? error.message : undefined) ||
    fallback
  );
}
```

### Why we use raw `axios.post` (not `axiosInstance`) for the refresh call

Calling `axiosInstance.post('/token/refresh/')` from inside the response interceptor would
re-trigger the same interceptor on failure → infinite recursion. The raw `axios` call bypasses
that and still sends the httpOnly cookie because we set `withCredentials: true` explicitly.

### Why the `failedQueue`

Imagine 5 components fire 5 requests at once, and the access token has just expired. Without the
queue, all 5 would each call `/token/refresh/`, the backend would issue 5 new refresh tokens, and
4 of them would be invalidated by token rotation. The queue ensures **exactly one** refresh call;
the other 4 wait, then replay with the new token.

---

## 7. Auth API surface — `src/lib/api/auth.api.ts`

```ts
import axiosInstance, { getAxiosErrorMessage } from "./axios";
import { useAuthStore } from "@/store/auth.store";
import type { User } from "@/types/user";
import type { AxiosError } from "axios";

export interface LoginCredentials { username: string; password: string; }
export interface AuthResponse    { access: string; }

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const { data } = await axiosInstance.post<AuthResponse>("/token/", credentials);
    return data;
  } catch (error) {
    const ax = error as AxiosError | undefined;
    throw new Error(getAxiosErrorMessage(error, "Login failed: " + ax?.response?.status));
  }
}

export async function logout(): Promise<void> {
  try {
    await axiosInstance.post("/logout/");
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, "Logout failed: "));
  }
  // Cookie clearing happens in useAuthStore.logout()
}

export async function refreshToken(): Promise<{ access: string }> {
  try {
    const { data } = await axiosInstance.post<{ access: string }>("/token/refresh/", {});
    if (typeof window !== "undefined") {
      useAuthStore.getState().setAccessToken(data.access);
    }
    return data;
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, "Token refresh failed"));
  }
}

/**
 * Restore the access token from the refresh cookie after a hard reload.
 * Call this BEFORE the first authenticated request on app boot.
 */
export async function tryRestoreSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (useAuthStore.getState().accessToken) return true;
  try {
    await refreshToken();
    return true;
  } catch {
    return false;
  }
}

export async function me(): Promise<User> {
  try {
    const { data } = await axiosInstance.get<User>("/users/me/");
    return data;
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, "Failed to fetch user"));
  }
}
```

---

## 8. Proxy (Next.js 16) — `src/proxy.ts`

The proxy runs at the network edge before pages render. Its only job for auth is:

1. Let public routes through.
2. For protected routes, check the non-secret `session` cookie. If missing → redirect to `/login`
   with `?redirect=<original-path>`.

The proxy **does not** decode the JWT and **does not** call the backend. The backend is the
source of truth on every request — the `session` cookie is just a routing hint.

```ts
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Public routes
  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  if (isPublic) return NextResponse.next();

  // 2) Auth indicator (non-secret; backend revalidates everything)
  const session = request.cookies.get("session")?.value;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3) Root → app home for logged-in users
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_vercel).*)"],
};
```

> **Next.js ≤ 15:** rename the file to `src/middleware.ts` and rename the export to
> `middleware`. Logic is identical.

---

## 9. The `useAuth` hook — `src/hooks/useAuth.ts`

Wires everything together client-side. On first mount it:

1. Calls `tryRestoreSession()` (silent refresh from the httpOnly cookie).
2. Calls `me()` to load the user profile.

```ts
"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { me, logout as logoutApi, tryRestoreSession } from "@/lib/api/auth.api";
import type { User } from "@/types/user";

function isNetworkError(err: unknown): boolean {
  return (err instanceof Error ? err.message : String(err)) === "Network Error";
}

function isExpectedAuthError(err: unknown): boolean {
  const s = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    s.includes("no refresh token") ||
    s.includes("refresh token") ||
    s.includes("unauthorized") ||
    s.includes("authentication") ||
    s.includes("credentials were not provided")
  );
}

export function useAuth() {
  const router = useRouter();
  const {
    user, permissions, isLoading, hasHydrated,
    setUser, setPermissions, setLoading, setHasHydrated,
    logout: logoutStore,
  } = useAuthStore();

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      await tryRestoreSession();
      const userData: User = await me();
      setUser(userData);
      setPermissions(userData.permissions || []);
    } catch (err) {
      setUser(null);
      setPermissions([]);
      if (isExpectedAuthError(err)) {
        // Expected after logout / expired session — interceptor handles redirect.
      } else if (isNetworkError(err)) {
        logoutStore();
        router.push("/login");
      } else {
        console.error("Failed to load user:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser, setPermissions, logoutStore, router]);

  useEffect(() => {
    if (!hasHydrated && !isLoading) {
      setHasHydrated(true);
      loadUser().catch(() => {});
    }
  }, [hasHydrated, isLoading, setHasHydrated, loadUser]);

  const logout = useCallback(async () => {
    try { await logoutApi(); } catch (e) { console.error(e); }
    finally { logoutStore(); router.push("/login"); }
  }, [logoutStore, router]);

  return { user, permissions, isLoading, loadUser, logout };
}
```

---

## 10. Login page — minimal example

```tsx
"use client";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth.api";
import { useAuthStore } from "@/store/auth.store";
import { setCookie } from "@/lib/utils/cookie-utils";

export default function LoginPage() {
  const router = useRouter();

  async function handleSubmit(username: string, password: string) {
    const res = await login({ username, password });

    // 1) In-memory access token only
    useAuthStore.getState().setAccessToken(res.access);

    // 2) Non-secret routing flag for the proxy
    setCookie("session", "active", 7);

    // 3) Go to the app
    router.push("/dashboard");
  }

  // … render form
  return null;
}
```

---

## 11. Lifecycle, step by step

### 11.1 Login
```
POST /api/v1/token/   { username, password }
  → { access: "<JWT>" }
  ← Set-Cookie: refresh=<JWT>; HttpOnly; Path=/api/token/refresh/; SameSite=Lax; Secure?
```
Frontend then:
- `useAuthStore.setAccessToken(res.access)`
- `setCookie("session", "active")`
- `router.push("/dashboard")`

### 11.2 Authenticated request
```
GET /api/v1/users/me/
  Authorization: Bearer <accessToken>           // injected by request interceptor
  Cookie: refresh=...                            // sent because withCredentials, but ignored by this endpoint
  → 200 OK
```

### 11.3 Access token expired
```
GET /api/v1/users/me/  → 401
  ↓ response interceptor catches it
  ↓ originalRequest._retry = true
  ↓ POST /api/v1/token/refresh/ (raw axios, withCredentials)
  ← 200 { access: "<new JWT>" }  + new Set-Cookie: refresh=<rotated>
  ↓ store.setAccessToken(new)
  ↓ processQueue(null, newAccessToken)        // any queued requests retry
  ↓ replay original request with new bearer
  → 200 OK
```

### 11.4 Refresh token expired / invalid
```
POST /api/v1/token/refresh/ → 401
  ↓ processQueue(error, null)                  // every queued request rejects
  ↓ store.logout()                              // clears in-memory token + session cookie
  ↓ window.location.href = "/login"            // hard nav so all stale state is wiped
```

### 11.5 Hard page refresh
- Zustand state is gone (in-memory only) → `accessToken === null`.
- httpOnly refresh cookie is still there.
- `useAuth` runs `tryRestoreSession()` on mount → `POST /token/refresh/` → fresh access token.
- If that fails, the first authenticated request returns 401 → the interceptor runs refresh once
  and retries; if refresh fails, the user is sent to `/login`.

### 11.6 Logout
```
POST /api/v1/logout/
  ← Set-Cookie: refresh=; Max-Age=0   // backend clears the httpOnly cookie
```
Frontend then `store.logout()` (clears in-memory token + `session` cookie) and pushes to
`/login`.

---

## 12. Backend contract checklist

For this frontend setup to work, your backend must provide:

| Endpoint | Method | Auth | Behavior |
|---|---|---|---|
| `/api/v1/token/` | POST | none | Returns `{ access }`. **Sets httpOnly refresh cookie** on the response, `Path=/api/token/refresh/`, `SameSite=Lax`, `Secure` in prod. |
| `/api/v1/token/refresh/` | POST | refresh cookie | Returns `{ access }`. Rotates and re-sets the refresh cookie. |
| `/api/v1/logout/` | POST | bearer | Invalidates the refresh token server-side and clears the cookie. |
| `/api/v1/users/me/` | GET | bearer | Current user's profile (`{ id, username, email, permissions, ... }`). |

CORS:
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Origin` must be the **exact** frontend origin (no `*`).
- The frontend axios instance has `withCredentials: true`, so the cookie is sent on every call.

---

## 13. Security do's and don'ts

**Do**
- Keep the access token in memory only.
- Keep the refresh token as `HttpOnly; Secure; SameSite=Lax; Path=/api/token/refresh/`.
- Validate the bearer on **every** backend request.
- Use the request queue to coalesce concurrent refreshes.
- Use `withCredentials: true` so the httpOnly cookie is sent automatically.

**Don't**
- Don't put tokens in `localStorage`/`sessionStorage` (XSS-readable).
- Don't call `axiosInstance` from inside the response interceptor's refresh branch — use raw
  `axios` to avoid recursion.
- Don't decode the JWT in the proxy and trust it for authorization. The `session` cookie is a
  routing hint only.
- Don't expose `NEXT_PUBLIC_API_URL` with credentials baked in. It is just a host.

---

## 14. Quick adoption checklist for a new project

1. `npm i axios zustand` (and your router, e.g. Next.js 16).
2. Create `.env.local` with `NEXT_PUBLIC_API_URL=...`.
3. Copy these files in order:
   - `src/lib/utils/env.ts`
   - `src/lib/utils/cookie-utils.ts`
   - `src/types/user.ts`      (define `User`)
   - `src/store/auth.store.ts`
   - `src/lib/api/axios.ts`
   - `src/lib/api/auth.api.ts`
   - `src/hooks/useAuth.ts`
   - `src/proxy.ts`           (or `src/middleware.ts` on Next.js ≤ 15)
4. Build a `/login` page that calls `login()`, sets the `session` cookie, stores the access
   token in Zustand, and redirects to `/dashboard`.
5. Make sure your backend matches the contract in §12.
6. Smoke test:
   - Login → land on `/dashboard`.
   - Hard refresh → still authenticated (silent refresh).
   - Wait for access token to expire → next request transparently refreshes and succeeds.
   - Revoke refresh on the backend → next request fails refresh → kicked to `/login`.
