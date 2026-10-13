import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { isAdmin } from "@/lib/server";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const status = ["pendiente", "completado", "cancelado"].includes(body.status) ? body.status : "pendiente";
  const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, Number(id))).returning();
  if (!updated) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  await db.delete(orders).where(eq(orders.id, Number(id)));
  return NextResponse.json({ ok: true });
}
