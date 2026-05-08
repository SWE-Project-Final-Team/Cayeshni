import { NextResponse } from "next/server";
import { getInternalApiBase } from "@/lib/server/internal-api";

const REFRESH_COOKIE = "refresh";
const REFRESH_PATH = "/api/token/refresh";

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const base = getInternalApiBase();

  if (auth) {
    await fetch(`${base}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
    }).catch(() => {});
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set({
    name: REFRESH_COOKIE,
    value: "",
    path: REFRESH_PATH,
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
  });
  return response;
}
