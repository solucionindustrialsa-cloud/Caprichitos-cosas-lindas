import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdmin } from "@/lib/server";

export async function GET() {
  return NextResponse.json({ admin: await isAdmin() });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
