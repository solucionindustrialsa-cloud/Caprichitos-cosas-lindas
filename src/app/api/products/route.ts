import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureSeed, isAdmin } from "@/lib/server";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  await ensureSeed();
  const all = req.nextUrl.searchParams.get("all") === "1";
  if (all && (await isAdmin())) {
    const rows = await db.select().from(products).orderBy(desc(products.createdAt));
    return NextResponse.json(rows);
  }
  const rows = await db.select().from(products).where(eq(products.active, true)).orderBy(desc(products.featured), desc(products.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await ensureSeed();
  const body = await req.json();
  if (!body.name || typeof body.name !== "string") return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  const [created] = await db.insert(products).values({
    name: body.name.slice(0, 120),
    description: String(body.description ?? "").slice(0, 600),
    price: Math.max(0, Math.round(Number(body.price) || 0)),
    oldPrice: body.oldPrice ? Math.max(0, Math.round(Number(body.oldPrice))) : null,
    category: String(body.category ?? "Bolsos").slice(0, 40),
    image: typeof body.image === "string" ? body.image : "",
    stock: Math.max(0, Math.round(Number(body.stock) || 0)),
    featured: Boolean(body.featured),
    active: body.active !== false,
  }).returning();
  return NextResponse.json(created, { status: 201 });
}
