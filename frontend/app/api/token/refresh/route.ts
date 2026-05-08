import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getInternalApiBase } from "@/lib/server/internal-api";

const REFRESH_COOKIE = "refresh";
const REFRESH_PATH = "/api/token/refresh";
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

function clearRefreshCookie(response: NextResponse) {
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: "",
    path: REFRESH_PATH,
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
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
  const newRefresh = payload.refreshToken ?? payload.RefreshToken;

  if (typeof accessToken !== "string" || typeof newRefresh !== "string") {
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
    sameSite: "lax",
    path: REFRESH_PATH,
    secure: process.env.NODE_ENV === "production",
    maxAge: REFRESH_MAX_AGE,
  });
  return response;
}
