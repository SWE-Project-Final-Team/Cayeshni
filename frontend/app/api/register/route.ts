import { NextResponse } from "next/server";
import { getInternalApiBase } from "@/lib/server/internal-api";

const REFRESH_COOKIE = "refresh";
const REFRESH_PATH = "/api/token/refresh";
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

type RegisterBody = { email?: string; name?: string; password?: string };

export async function POST(request: Request) {
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !name || !password) {
    return NextResponse.json(
      { detail: "Email, display name, and password are required" },
      { status: 400 }
    );
  }

  if (name.length < 3) {
    return NextResponse.json(
      { error: "Name must be at least 3 characters." },
      { status: 400 }
    );
  }

  const upstream = await fetch(`${getInternalApiBase()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, password }),
  });

  const payload = (await upstream.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!upstream.ok) {
    return NextResponse.json(payload, { status: upstream.status });
  }

  const accessToken = payload.accessToken ?? payload.AccessToken;
  const refreshToken = payload.refreshToken ?? payload.RefreshToken;

  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
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
    sameSite: "lax",
    path: REFRESH_PATH,
    secure: process.env.NODE_ENV === "production",
    maxAge: REFRESH_MAX_AGE,
  });
  return response;
}
