import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_PASSWORD, adminToken } from "@/lib/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (String(body.password ?? "") !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
