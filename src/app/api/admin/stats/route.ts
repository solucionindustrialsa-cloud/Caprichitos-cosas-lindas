import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { ensureSeed, isAdmin } from "@/lib/server";
import { desc } from "drizzle-orm";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await ensureSeed();

  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(1000);
  const allProducts = await db.select().from(products);
  const completed = allOrders.filter((o) => o.status === "completado");
  const revenue = completed.reduce((a, o) => a + o.total, 0);

  // Ventas por día (últimos 14 días, solo completados)
  const days: { date: string; label: string; ventas: number; pedidos: number }[] = [];
  for (let d = 13; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const key = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
    const dayOrders = completed.filter((o) => new Date(o.createdAt).toISOString().slice(0, 10) === key);
    days.push({ date: key, label, ventas: dayOrders.reduce((a, o) => a + o.total, 0), pedidos: dayOrders.length });
  }

  // Ventas por categoría
  const catMap = new Map<string, number>();
  for (const o of completed) {
    for (const it of o.items ?? []) {
      catMap.set(it.category || "Otros", (catMap.get(it.category || "Otros") ?? 0) + it.price * it.quantity);
    }
  }
  const byCategory = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

  // Productos más vendidos
  const prodMap = new Map<string, { name: string; unidades: number; ingresos: number }>();
  for (const o of completed) {
    for (const it of o.items ?? []) {
      const cur = prodMap.get(it.name) ?? { name: it.name, unidades: 0, ingresos: 0 };
      cur.unidades += it.quantity;
      cur.ingresos += it.price * it.quantity;
      prodMap.set(it.name, cur);
    }
  }
  const topProducts = Array.from(prodMap.values()).sort((a, b) => b.ingresos - a.ingresos).slice(0, 6);

  // Clientes (agrupados por teléfono o nombre)
  const clientMap = new Map<string, { name: string; phone: string; orders: number; spent: number; lastOrder: string }>();
  for (const o of allOrders) {
    if (o.status === "cancelado") continue;
    const key = (o.customerPhone || o.customerName).toLowerCase();
    const cur = clientMap.get(key) ?? { name: o.customerName, phone: o.customerPhone, orders: 0, spent: 0, lastOrder: new Date(o.createdAt).toISOString() };
    cur.orders += 1;
    if (o.status === "completado") cur.spent += o.total;
    if (new Date(o.createdAt) > new Date(cur.lastOrder)) cur.lastOrder = new Date(o.createdAt).toISOString();
    clientMap.set(key, cur);
  }
  const clients = Array.from(clientMap.values()).sort((a, b) => b.spent - a.spent);

  // Medios de pago
  const payMap = new Map<string, number>();
  for (const o of completed) payMap.set(o.paymentMethod, (payMap.get(o.paymentMethod) ?? 0) + o.total);
  const byPayment = Array.from(payMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  return NextResponse.json({
    totals: {
      revenue,
      orders: allOrders.length,
      completedOrders: completed.length,
      pendingOrders: allOrders.filter((o) => o.status === "pendiente").length,
      clients: clients.length,
      products: allProducts.length,
      lowStock: allProducts.filter((p) => p.stock <= 5).length,
      avgTicket: completed.length ? Math.round(revenue / completed.length) : 0,
    },
    salesByDay: days,
    byCategory,
    byPayment,
    topProducts,
    clients,
    recentOrders: allOrders.slice(0, 8),
  });
}
