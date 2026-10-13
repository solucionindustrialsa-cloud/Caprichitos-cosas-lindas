export type PaymentMethod = {
  id: string;
  name: string;
  detail: string;
  enabled: boolean;
};

export type Settings = {
  id: number;
  storeName: string;
  tagline: string;
  logo: string;
  whatsapp: string;
  instagram: string;
  paymentMethods: PaymentMethod[];
  shippingNote: string;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  oldPrice: number | null;
  category: string;
  image: string;
  stock: number;
  featured: boolean;
  active: boolean;
  createdAt: string;
};

export type OrderItem = {
  productId: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image?: string;
};

export type Order = {
  id: number;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  status: "pendiente" | "completado" | "cancelado";
  source: string;
  createdAt: string;
};

export type Stats = {
  totals: {
    revenue: number;
    orders: number;
    completedOrders: number;
    pendingOrders: number;
    clients: number;
    products: number;
    lowStock: number;
    avgTicket: number;
  };
  salesByDay: { date: string; label: string; ventas: number; pedidos: number }[];
  byCategory: { name: string; value: number }[];
  byPayment: { name: string; value: number }[];
  topProducts: { name: string; unidades: number; ingresos: number }[];
  clients: { name: string; phone: string; orders: number; spent: number; lastOrder: string }[];
  recentOrders: Order[];
};

export const CATEGORIES = ["Bolsos", "Mochilas", "Vasos Térmicos"] as const;

// La implementación vive en "@/lib/helpers"; se re-exporta acá para que
// cualquier importación existente desde "@/lib/types" siga funcionando.
export { formatPrice } from "./helpers";
