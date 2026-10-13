import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { isAdmin } from "@/lib/server";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const values: Partial<typeof products.$inferInsert> = {};
  if (body.name !== undefined) values.name = String(body.name).slice(0, 120);
  if (body.description !== undefined) values.description = String(body.description).slice(0, 600);
  if (body.price !== undefined) values.price = Math.max(0, Math.round(Number(body.price) || 0));
  if (body.oldPrice !== undefined) values.oldPrice = body.oldPrice ? Math.max(0, Math.round(Number(body.oldPrice))) : null;
  if (body.category !== undefined) values.category = String(body.category).slice(0, 40);
  if (body.image !== undefined) values.image = String(body.image);
  if (body.stock !== undefined) values.stock = Math.max(0, Math.round(Number(body.stock) || 0));
  if (body.featured !== undefined) values.featured = Boolean(body.featured);
  if (body.active !== undefined) values.active = Boolean(body.active);
  const [updated] = await db.update(products).set(values).where(eq(products.id, Number(id))).returning();
  if (!updated) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  await db.delete(products).where(eq(products.id, Number(id)));
  return NextResponse.json({ ok: true });
}
