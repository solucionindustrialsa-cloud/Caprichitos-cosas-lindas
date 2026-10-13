import { createHash } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { orders, products, settings, type PaymentMethod } from "@/db/schema";

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Jessi123";
export const ADMIN_COOKIE = "caprichitos_admin";

export function adminToken() {
  return createHash("sha256").update(`caprichitos::${ADMIN_PASSWORD}`).digest("hex");
}

export async function isAdmin() {
  try {
    const store = await cookies();
    return store.get(ADMIN_COOKIE)?.value === adminToken();
  } catch {
    return false;
  }
}

export const DEFAULT_PAYMENTS: PaymentMethod[] = [
  { id: "efectivo", name: "Efectivo", detail: "Pagás al retirar o contra entrega", enabled: true },
  { id: "transferencia", name: "Transferencia bancaria", detail: "Alias: caprichitos.tienda — enviá el comprobante por WhatsApp", enabled: true },
  { id: "mercadopago", name: "Mercado Pago", detail: "Tarjetas, dinero en cuenta y cuotas", enabled: true },
  { id: "tarjeta", name: "Tarjeta de crédito / débito", detail: "Visa, Mastercard, Amex — hasta 3 cuotas sin interés", enabled: true },
];

const SEED_PRODUCTS = [
  { name: "Bolso Acolchado Rosa Pastel", description: "Bolso acolchado súper suave con cadena dorada, cierre magnético y bolsillo interno. Ideal para todos los días.", price: 28500, oldPrice: 34000, category: "Bolsos", image: "/images/hero-bag.png", stock: 14, featured: true },
  { name: "Cartera Crema con Perlas", description: "Cartera de hombro color crema con detalles de perlas y herrajes dorados. Elegante y combinable con todo.", price: 32900, oldPrice: null, category: "Bolsos", image: "/images/prod-bolso-crema.jpg", stock: 9, featured: true },
  { name: "Bandolera Rosa Chicle", description: "Bandolera compacta con correa regulable, perfecta para salidas. Entra el celu, billetera y tus esenciales.", price: 19800, oldPrice: 24500, category: "Bolsos", image: "https://images.pexels.com/photos/21897149/pexels-photo-21897149.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", stock: 20, featured: false },
  { name: "Bolso Tote Fashion Rosa", description: "Tote amplio y canchero para llevar de todo con estilo. Material resistente y fácil de limpiar.", price: 24700, oldPrice: null, category: "Bolsos", image: "https://images.pexels.com/photos/21897112/pexels-photo-21897112.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", stock: 11, featured: false },
  { name: "Mochila Rosa con Moño", description: "Mochila femenina con cierres dorados y dije de moño. Compartimento para notebook de 14\".", price: 36900, oldPrice: 42900, category: "Mochilas", image: "/images/prod-mochila-rosa.jpg", stock: 8, featured: true },
  { name: "Mochila Floral Bohemia", description: "Mochila de tela con estampado floral rosa, bolsillos amplios y espalda acolchada. Liviana y cómoda.", price: 31400, oldPrice: null, category: "Mochilas", image: "https://images.pexels.com/photos/9443519/pexels-photo-9443519.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", stock: 12, featured: false },
  { name: "Mochila Urbana Flores", description: "Mochila urbana con diseño floral delicado, ideal para la facu, el trabajo o escapadas de finde.", price: 29800, oldPrice: 33500, category: "Mochilas", image: "https://images.pexels.com/photos/9443531/pexels-photo-9443531.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", stock: 15, featured: false },
  { name: "Vaso Térmico Rosa 1.2L con Asa", description: "Vaso térmico tipo stanley de 1.2L: mantiene frío 12h y calor 8h. Con asa, sorbete y tapa hermética.", price: 18900, oldPrice: 22900, category: "Vasos Térmicos", image: "/images/prod-vaso-rosa.jpg", stock: 25, featured: true },
  { name: "Vaso Térmico Floral con Sorbete", description: "Vaso térmico con diseño floral, doble pared de acero y sorbete reutilizable. ¡Divino para llevar a todos lados!", price: 16400, oldPrice: null, category: "Vasos Térmicos", image: "/images/prod-vaso-flores.jpg", stock: 30, featured: false },
  { name: "Vaso Térmico Botella Floral", description: "Botella térmica con flores, pico deportivo y capacidad de 900ml. Libre de BPA.", price: 14900, oldPrice: 17900, category: "Vasos Térmicos", image: "https://images.pexels.com/photos/7764532/pexels-photo-7764532.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", stock: 22, featured: false },
];

const DEMO_CLIENTS = [
  { name: "Sofía Martínez", phone: "5491123456789" },
  { name: "Valentina López", phone: "5491134567890" },
  { name: "Camila Fernández", phone: "5491145678901" },
  { name: "Martina Gómez", phone: "5491156789012" },
  { name: "Lucía Rodríguez", phone: "5491167890123" },
  { name: "Mía Torres", phone: "5491178901234" },
  { name: "Julieta Pérez", phone: "5491189012345" },
  { name: "Agustina Díaz", phone: "5491190123456" },
];

let seeded = false;

export async function ensureSeed() {
  if (seeded) return;
  try {
    const existingSettings = await db.select().from(settings).limit(1);
    if (existingSettings.length === 0) {
      await db.insert(settings).values({
        storeName: "caprichitos_cosas_lindas",
        tagline: "Bolsos, mochilas y vasos térmicos que enamoran",
        logo: "",
        whatsapp: "5491100000000",
        instagram: "caprichitos_cosas_lindas",
        paymentMethods: DEFAULT_PAYMENTS,
        shippingNote: "Envíos a todo el país · Retiro sin cargo por el local",
      });
    }
    const existingProducts = await db.select({ id: products.id }).from(products).limit(1);
    let productRows = await db.select().from(products);
    if (existingProducts.length === 0) {
      await db.insert(products).values(SEED_PRODUCTS);
      productRows = await db.select().from(products);
    }
    const existingOrders = await db.select({ id: orders.id }).from(orders).limit(1);
    if (existingOrders.length === 0 && productRows.length > 0) {
      // Pedidos de demostración de los últimos 14 días para las gráficas
      const demo: (typeof orders.$inferInsert)[] = [];
      const payments = ["Mercado Pago", "Transferencia bancaria", "Efectivo", "Tarjeta de crédito / débito"];
      let n = 0;
      for (let day = 13; day >= 0; day--) {
        const count = 1 + ((day * 7 + 3) % 4); // 1 a 4 pedidos por día
        for (let i = 0; i < count; i++) {
          const client = DEMO_CLIENTS[(n * 3 + day + i) % DEMO_CLIENTS.length];
          const p1 = productRows[(n + day) % productRows.length];
          const p2 = productRows[(n + day + 4) % productRows.length];
          const items = [
            { productId: p1.id, name: p1.name, category: p1.category, price: p1.price, quantity: 1 },
            ...(i % 2 === 0 ? [{ productId: p2.id, name: p2.name, category: p2.category, price: p2.price, quantity: 1 }] : []),
          ];
          const total = items.reduce((a, it) => a + it.price * it.quantity, 0);
          const date = new Date();
          date.setDate(date.getDate() - day);
          date.setHours(10 + ((n + i) % 9), (n * 13) % 60, 0, 0);
          demo.push({
            customerName: client.name,
            customerPhone: client.phone,
            items,
            total,
            paymentMethod: payments[(n + i) % payments.length],
            status: day === 0 && i === 0 ? "pendiente" : "completado",
            source: "whatsapp",
            createdAt: date,
          });
          n++;
        }
      }
      if (demo.length) await db.insert(orders).values(demo);
    }
    seeded = true;
  } catch (e) {
    // Las tablas pueden no existir aún en el primer arranque; no bloquear.
    console.error("ensureSeed:", e);
  }
}

// Re-exportado desde "@/lib/helpers" (implementación única) por compatibilidad.
export { formatPrice } from "./helpers";
