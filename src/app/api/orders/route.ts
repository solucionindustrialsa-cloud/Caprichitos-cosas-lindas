import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ensureSeed, isAdmin } from "@/lib/server";
import { desc } from "drizzle-orm";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await ensureSeed();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(300);
  return NextResponse.json(rows);
}

/** Crea el pedido cuando la clienta confirma por WhatsApp (queda registrado para las gráficas/clientes). */
export async function POST(req: NextRequest) {
  await ensureSeed();
  const body = await req.json();
  const items = Array.isArray(body.items) ? body.items : [];
  if (!body.customerName || items.length === 0) {
    return NextResponse.json({ error: "Faltan datos del pedido" }, { status: 400 });
  }
  const total = items.reduce((a: number, it: { price?: number; quantity?: number }) => a + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const [created] = await db.insert(orders).values({
    customerName: String(body.customerName).slice(0, 80),
    customerPhone: String(body.customerPhone ?? "").slice(0, 30),
    items: items.map((it: Record<string, unknown>) => ({
      productId: Number(it.productId) || 0,
      name: String(it.name ?? "Producto"),
      category: String(it.category ?? ""),
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
      image: typeof it.image === "string" ? it.image.slice(0, 300) : undefined,
    })),
    total,
    paymentMethod: String(body.paymentMethod ?? "A convenir").slice(0, 60),
    status: "pendiente",
    source: "whatsapp",
  }).returning();
  return NextResponse.json(created, { status: 201 });
}
