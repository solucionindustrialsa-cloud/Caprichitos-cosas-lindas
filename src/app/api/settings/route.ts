import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { ensureSeed, isAdmin } from "@/lib/server";
import { eq } from "drizzle-orm";

export async function GET() {
  await ensureSeed();
  const rows = await db.select().from(settings).limit(1);
  return NextResponse.json(rows[0] ?? null);
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await ensureSeed();
  const body = await req.json();
  const rows = await db.select().from(settings).limit(1);
  const current = rows[0];
  const values = {
    storeName: String(body.storeName ?? current?.storeName ?? "caprichitos_cosas_lindas").slice(0, 80),
    tagline: String(body.tagline ?? current?.tagline ?? "").slice(0, 160),
    logo: typeof body.logo === "string" ? body.logo : current?.logo ?? "",
    whatsapp: String(body.whatsapp ?? current?.whatsapp ?? "").replace(/[^\d]/g, "").slice(0, 20),
    instagram: String(body.instagram ?? current?.instagram ?? "").replace(/^@/, "").slice(0, 60),
    paymentMethods: Array.isArray(body.paymentMethods) ? body.paymentMethods : current?.paymentMethods ?? [],
    shippingNote: String(body.shippingNote ?? current?.shippingNote ?? "").slice(0, 200),
    updatedAt: new Date(),
  };
  if (current) {
    const [updated] = await db.update(settings).set(values).where(eq(settings.id, current.id)).returning();
    return NextResponse.json(updated);
  }
  const [created] = await db.insert(settings).values(values).returning();
  return NextResponse.json(created);
}
