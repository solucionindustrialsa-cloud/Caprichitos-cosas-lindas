import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export type PaymentMethod = {
  id: string;
  name: string;
  detail: string;
  enabled: boolean;
};

export type OrderItem = {
  productId: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image?: string;
};

/** Configuración general de la tienda (fila única, id = 1) */
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull().default("caprichitos_cosas_lindas"),
  tagline: text("tagline").notNull().default("Cosas lindas para vos"),
  logo: text("logo").notNull().default(""), // data URL o ruta
  whatsapp: text("whatsapp").notNull().default("5491100000000"),
  instagram: text("instagram").notNull().default("caprichitos_cosas_lindas"),
  paymentMethods: jsonb("payment_methods").$type<PaymentMethod[]>().notNull().default([]),
  shippingNote: text("shipping_note").notNull().default("Envíos a todo el país y retiros en tienda"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: integer("price").notNull().default(0), // en pesos (entero)
  oldPrice: integer("old_price"),
  category: text("category").notNull().default("Bolsos"),
  image: text("image").notNull().default(""), // data URL elegida desde el dispositivo o ruta
  stock: integer("stock").notNull().default(10),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull().default(""),
  items: jsonb("items").$type<OrderItem[]>().notNull().default([]),
  total: integer("total").notNull().default(0),
  paymentMethod: text("payment_method").notNull().default("WhatsApp"),
  status: text("status").notNull().default("pendiente"), // pendiente | completado | cancelado
  source: text("source").notNull().default("whatsapp"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
