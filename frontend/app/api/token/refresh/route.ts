import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getInternalApiBase } from "@/lib/server/internal-api";

const REFRESH_COOKIE = "refreshToken";
const REFRESH_PATH = "/api/token/refresh";
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;
function readCookieValue(setCookie: string | null, cookieName: string): string | null {
  if (!setCookie) return null;
  const escaped = cookieName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = setCookie.match(new RegExp(`(?:^|,\\s*)${escaped}=([^;]+)`));
  return match?.[1] ?? null;
}

function clearRefreshCookie(response: NextResponse) {
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: "",
    path: REFRESH_PATH,
    maxAge: 0,
    httpOnly: true,
    sameSite: "strict",
  });
}

export async function POST() {
  const cookieStore = await cookies();
  const refresh = cookieStore.get(REFRESH_COOKIE)?.value;
  if (!refresh) {
    const response = NextResponse.json(
      { detail: "No refresh token" },
      { status: 401 }
    );
    clearRefreshCookie(response);
    return response;
  }

  const upstream = await fetch(`${getInternalApiBase()}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}`,
    },
  });

  const payload = (await upstream.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!upstream.ok) {
    const response = NextResponse.json(payload, { status: upstream.status });
    clearRefreshCookie(response);
    return response;
  }

  const accessToken = payload.accessToken ?? payload.AccessToken;
  const newRefresh =
    readCookieValue(upstream.headers.get("set-cookie"), REFRESH_COOKIE) ?? refresh;

  if (typeof accessToken !== "string") {
    const response = NextResponse.json(
      { detail: "Unexpected auth response from server" },
      { status: 502 }
    );
    clearRefreshCookie(response);
    return response;
  }

  const response = NextResponse.json({ access: accessToken });
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: newRefresh,
    httpOnly: true,
    sameSite: "strict",
    path: REFRESH_PATH,
    secure: process.env.NODE_ENV === "production",
    maxAge: REFRESH_MAX_AGE,
  });
  return response;
}
