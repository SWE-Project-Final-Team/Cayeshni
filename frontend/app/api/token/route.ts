import { NextResponse } from "next/server";
import { getInternalApiBase } from "@/lib/server/internal-api";

const REFRESH_COOKIE = "refreshToken";
const REFRESH_PATH = "/api/token/refresh";
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

type LoginBody = { email?: string; password?: string };
function readCookieValue(setCookie: string | null, cookieName: string): string | null {
  if (!setCookie) return null;
  const escaped = cookieName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = setCookie.match(new RegExp(`(?:^|,\\s*)${escaped}=([^;]+)`));
  return match?.[1] ?? null;
}

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json(
      { detail: "Email and password are required" },
      { status: 400 }
    );
  }

  const upstream = await fetch(`${getInternalApiBase()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const payload = (await upstream.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!upstream.ok) {
    return NextResponse.json(payload, { status: upstream.status });
  }

  const accessToken = payload.accessToken ?? payload.AccessToken;
  const refreshToken = readCookieValue(
    upstream.headers.get("set-cookie"),
    REFRESH_COOKIE
  );

  if (typeof accessToken !== "string" || !refreshToken) {
    return NextResponse.json(
      { detail: "Unexpected auth response from server" },
      { status: 502 }
    );
  }

  const response = NextResponse.json({ access: accessToken });
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: refreshToken,
    httpOnly: true,
    sameSite: "strict",
    path: REFRESH_PATH,
    secure: process.env.NODE_ENV === "production",
    maxAge: REFRESH_MAX_AGE,
  });
  return response;
}
