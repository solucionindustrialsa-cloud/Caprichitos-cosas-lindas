"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Search, Plus, Minus, X, Trash2, MessageCircle, Heart, Sparkles,
  Truck, ShieldCheck, CreditCard, Banknote, Landmark, Wallet, Star, ChevronRight,
  Lock, AtSign, PackageCheck, MousePointerClick, Send, BadgePercent, CupSoda, Backpack,
} from "lucide-react";
import { Reveal, Tilt, StoreLogo } from "@/components/ui";
import { formatPrice } from "@/lib/helpers";
import type { Product, Settings } from "@/lib/types";

type CartItem = { product: Product; qty: number };

const FALLBACK_IMG = "/images/hero-bag.png";

function paymentIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("efectivo")) return Banknote;
  if (n.includes("transferencia") || n.includes("banco")) return Landmark;
  if (n.includes("mercado")) return Wallet;
  return CreditCard;
}

export default function HomePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [toast, setToast] = useState("");
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", payment: "" });

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([s, p]) => {
        setSettings(s);
        setProducts(Array.isArray(p) ? p : []);
        const firstPay = (s?.paymentMethods ?? []).find((m: { enabled: boolean }) => m.enabled)?.name ?? "";
        setForm((f) => ({ ...f, payment: firstPay }));
      })
      .finally(() => setLoading(false));
    try {
      const saved = localStorage.getItem("caprichitos_cart");
      if (saved) setCart(JSON.parse(saved));
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem("caprichitos_cart", JSON.stringify(cart)); } catch { /* noop */ }
  }, [cart]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const categories = useMemo(() => ["Todos", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const filtered = products.filter(
    (p) =>
      (category === "Todos" || p.category === category) &&
      (p.name + " " + p.description).toLowerCase().includes(search.toLowerCase())
  );
  const cartCount = cart.reduce((a, i) => a + i.qty, 0);
  const cartTotal = cart.reduce((a, i) => a + i.qty * i.product.price, 0);
  const enabledPayments = (settings?.paymentMethods ?? []).filter((m) => m.enabled);
  const featured = products.filter((p) => p.featured);

  function addToCart(p: Product, qty = 1) {
    setCart((prev) => {
      const found = prev.find((i) => i.product.id === p.id);
      if (found) return prev.map((i) => (i.product.id === p.id ? { ...i, qty: Math.min(i.qty + qty, 99) } : i));
      return [...prev, { product: p, qty }];
    });
    setToast(`${p.name} agregado al carrito`);
  }

  function setQty(id: number, qty: number) {
    setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, qty } : i)).filter((i) => i.qty > 0));
  }

  async function checkoutWhatsApp() {
    if (!settings) return;
    if (!form.name.trim()) { setToast("Escribí tu nombre para el pedido"); return; }
    if (cart.length === 0) { setToast("Tu carrito está vacío"); return; }
    setSending(true);
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          paymentMethod: form.payment || "A convenir por WhatsApp",
          items: cart.map((i) => ({ productId: i.product.id, name: i.product.name, category: i.product.category, price: i.product.price, quantity: i.qty, image: i.product.image })),
        }),
      });
    } catch { /* el pedido igual sale por WhatsApp */ }

    const lines = [
      `¡Hola ${settings.storeName}! Quiero hacer un pedido:`,
      "",
      ...cart.map((i) => `• ${i.product.name} x${i.qty} — ${formatPrice(i.product.price * i.qty)}`),
      "",
      `Total: ${formatPrice(cartTotal)}`,
      `Medio de pago: ${form.payment || "A convenir"}`,
      `Mi nombre: ${form.name.trim()}`,
      form.phone.trim() ? `Mi teléfono: ${form.phone.trim()}` : "",
    ].filter(Boolean);
    const url = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank");
    setSending(false);
    setCart([]);
    setCartOpen(false);
    setToast("¡Pedido enviado! Te respondemos por WhatsApp");
  }

  const storeName = settings?.storeName ?? "caprichitos_cosas_lindas";

  return (
    <div className="min-h-screen overflow-x-clip">
      {/* ---------- Barra superior ---------- */}
      <div className="bg-pink-500 text-center text-[13px] font-semibold text-white">
        <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-0.5 px-4 py-2">
          <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4" /> {settings?.shippingNote ?? "Envíos a todo el país"}</span>
          <span className="hidden items-center gap-1.5 sm:inline-flex"><BadgePercent className="h-4 w-4" /> 10% OFF pagando en efectivo</span>
        </p>
      </div>

      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-40 border-b border-pink-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <a href="#inicio" className="flex min-w-0 items-center gap-2.5">
            <StoreLogo logo={settings?.logo ?? ""} name={storeName} size={46} />
            <span className="min-w-0">
              <span className="font-display block truncate text-lg font-black leading-tight text-rose-950 sm:text-xl">{storeName}</span>
              <span className="block truncate text-[11px] font-semibold uppercase tracking-widest text-pink-500">cosas lindas para vos</span>
            </span>
          </a>
          <nav className="ml-auto hidden items-center gap-6 text-sm font-bold text-rose-900 lg:flex">
            <a href="#productos" className="transition hover:text-pink-600">Productos</a>
            <a href="#como-comprar" className="transition hover:text-pink-600">Cómo comprar</a>
            <a href="#pagos" className="transition hover:text-pink-600">Medios de pago</a>
          </nav>
          <div className="relative ml-auto lg:ml-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-36 rounded-full border border-pink-200 bg-pink-50/60 py-2 pl-9 pr-3 text-sm font-medium outline-none transition placeholder:text-pink-300 focus:w-48 focus:border-pink-400 focus:bg-white sm:w-44"
            />
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 rounded-full bg-pink-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-300 transition hover:bg-pink-600 active:scale-95"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden sm:inline">Carrito</span>
            {cartCount > 0 && (
              <span className="animate-pop absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-black ring-2 ring-white">{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      {/* ---------- Hero 3D ---------- */}
      <section id="inicio" className="dot-pattern relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-pink-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-rose-200/50 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 lg:grid-cols-2 lg:pt-16">
          <div>
            <Reveal variant="left">
              <span className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-1.5 text-xs font-black uppercase tracking-widest text-pink-600 shadow-sm">
                <Sparkles className="h-4 w-4" /> Nueva colección
              </span>
              <h1 className="font-display mt-5 text-5xl font-black leading-[1.05] text-rose-950 sm:text-6xl">
                Cosas lindas que te hacen <span className="italic text-pink-500">suspirar</span>
              </h1>
              <p className="mt-5 max-w-md text-lg font-medium text-rose-900/70">
                {settings?.tagline ?? "Bolsos, mochilas y vasos térmicos"} — elegidos con amor, con la calidad que merecés y pedidos fáciles por WhatsApp.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#productos" className="animate-pulse-ring inline-flex items-center gap-2 rounded-full bg-pink-500 px-7 py-3.5 font-bold text-white shadow-xl shadow-pink-300 transition hover:bg-pink-600 active:scale-95">
                  Ver productos <ChevronRight className="h-5 w-5" />
                </a>
                <button
                  onClick={() => settings && window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`¡Hola ${storeName}! Quiero hacer una consulta`)}`, "_blank")}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-green-500 bg-white px-7 py-3.5 font-bold text-green-600 transition hover:bg-green-50 active:scale-95"
                >
                  <MessageCircle className="h-5 w-5" /> WhatsApp
                </button>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold text-rose-900">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-pink-500" /> Compra protegida</span>
                <span className="inline-flex items-center gap-2"><Truck className="h-5 w-5 text-pink-500" /> Envíos a todo el país</span>
                <span className="inline-flex items-center gap-2"><Star className="h-5 w-5 fill-pink-500 text-pink-500" /> +500 clientas felices</span>
              </div>
            </Reveal>
          </div>

          {/* Escena 3D */}
          <Reveal variant="right" delay={150}>
            <div className="preserve-3d relative mx-auto max-w-md lg:max-w-none" style={{ perspective: "1200px" }}>
              <div className="animate-spin-slow absolute left-1/2 top-1/2 -z-0 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-pink-300/70" />
              <Tilt max={9} className="relative z-10">
                <div className="overflow-hidden rounded-[2.5rem] border-4 border-white shadow-2xl shadow-pink-300/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={featured[0]?.image || FALLBACK_IMG} alt={featured[0]?.name ?? "Producto destacado"} className="aspect-[4/5] w-full object-cover sm:aspect-square" />
                </div>
                {featured[0] && (
                  <div className="translate-z-50 absolute -bottom-5 left-5 right-5 flex items-center gap-3 rounded-3xl bg-white/95 p-4 shadow-xl shadow-pink-200 backdrop-blur">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-rose-950">{featured[0].name}</p>
                      <p className="text-sm font-black text-pink-600">{formatPrice(featured[0].price)}</p>
                    </div>
                    <button onClick={() => addToCart(featured[0])} className="flex items-center gap-1.5 rounded-full bg-pink-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-300 transition hover:bg-pink-600 active:scale-95">
                      <Plus className="h-4 w-4" /> Agregar
                    </button>
                  </div>
                )}
              </Tilt>
              <div className="animate-floaty absolute -left-4 top-8 z-20 hidden items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 shadow-xl shadow-pink-200 sm:flex">
                <Backpack className="h-5 w-5 text-pink-500" />
                <span className="text-sm font-black text-rose-950">Mochilas</span>
              </div>
              <div className="animate-floaty-slow absolute -right-3 top-1/3 z-20 hidden items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 shadow-xl shadow-pink-200 sm:flex">
                <CupSoda className="h-5 w-5 text-pink-500" />
                <span className="text-sm font-black text-rose-950">Vasos térmicos</span>
              </div>
              <Heart className="animate-bounce-soft absolute -top-4 right-10 z-20 h-9 w-9 fill-pink-400 text-pink-500 drop-shadow-lg" />
            </div>
          </Reveal>
        </div>

        {/* Marquee */}
        <div className="relative -rotate-1 border-y-4 border-white bg-pink-500 py-2.5 shadow-lg shadow-pink-200">
          <div className="animate-marquee flex w-max gap-0 whitespace-nowrap text-sm font-black uppercase tracking-[0.2em] text-white">
            {[0, 1].map((k) => (
              <span key={k} className="flex">
                {["Bolsos", "Mochilas", "Vasos térmicos", "Pedidos por WhatsApp", "Envíos a todo el país", "Nuevos ingresos cada semana"].map((t) => (
                  <span key={t} className="mx-6 flex items-center gap-6">{t} <Heart className="h-4 w-4 fill-white" /></span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Categorías 3D ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal variant="flip" className="text-center">
          <h2 className="font-display text-3xl font-black text-rose-950 sm:text-4xl">¿Qué estás buscando?</h2>
          <p className="mt-2 font-medium text-rose-900/60">Tocá una categoría y encontrá tu próximo caprichito</p>
        </Reveal>
        <div className="mt-9 grid gap-5 sm:grid-cols-3">
          {[
            { name: "Bolsos", img: "/images/prod-bolso-crema.jpg", icon: ShoppingBag, desc: "Carteras, bandoleras y totes" },
            { name: "Mochilas", img: "/images/prod-mochila-rosa.jpg", icon: Backpack, desc: "Para la facu, el trabajo y más" },
            { name: "Vasos Térmicos", img: "/images/prod-vaso-rosa.jpg", icon: CupSoda, desc: "Frío y calor por horas" },
          ].map((c, i) => (
            <Reveal key={c.name} delay={i * 120} variant="zoom">
              <Tilt max={7}>
                <button
                  onClick={() => { setCategory(c.name); document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="group relative block w-full overflow-hidden rounded-[2rem] text-left shadow-xl shadow-pink-200/70"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.img} alt={c.name} className="h-56 w-full object-cover transition duration-700 group-hover:scale-110" />
                  <span className="absolute inset-0 bg-rose-950/25 transition group-hover:bg-rose-950/35" />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                    <span>
                      <span className="font-display block text-2xl font-black text-white drop-shadow">{c.name}</span>
                      <span className="text-sm font-semibold text-pink-100">{c.desc}</span>
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-pink-600 shadow-lg transition group-hover:scale-110">
                      <c.icon className="h-5 w-5" />
                    </span>
                  </span>
                </button>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Productos ---------- */}
      <section id="productos" className="border-y border-pink-100 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal variant="flip" className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.25em] text-pink-500">Catálogo</span>
              <h2 className="font-display mt-1 text-3xl font-black text-rose-950 sm:text-4xl">Nuestros caprichitos</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${
                    category === c ? "bg-pink-500 text-white shadow-lg shadow-pink-300" : "border border-pink-200 bg-pink-50 text-rose-800 hover:border-pink-400"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Reveal>

          {loading ? (
            <div className="grid gap-6 py-14 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-96 animate-pulse rounded-[1.8rem] bg-pink-100/70" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <PackageCheck className="mx-auto h-14 w-14 text-pink-300" />
              <p className="mt-4 font-bold text-rose-900">No encontramos productos con ese criterio</p>
              <p className="text-sm font-medium text-rose-400">Probá con otra categoría o búsqueda</p>
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" style={{ perspective: "1400px" }}>
              {filtered.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 110} variant={i % 3 === 0 ? "left" : i % 3 === 2 ? "right" : "up"}>
                  <Tilt max={5} className="h-full">
                    <article className="group flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-pink-100 bg-white shadow-lg shadow-pink-100 transition-shadow hover:shadow-2xl hover:shadow-pink-200">
                      <button onClick={() => { setDetail(p); setDetailQty(1); }} className="relative block overflow-hidden text-left">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image || FALLBACK_IMG} alt={p.name} className="h-64 w-full object-cover transition duration-700 group-hover:scale-108" loading="lazy" />
                        {p.oldPrice && p.oldPrice > p.price && (
                          <span className="absolute left-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white shadow-lg">
                            -{Math.round((1 - p.price / p.oldPrice) * 100)}% OFF
                          </span>
                        )}
                        {p.featured && (
                          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-pink-600 shadow">
                            <Star className="h-3.5 w-3.5 fill-pink-500 text-pink-500" /> Destacado
                          </span>
                        )}
                        <span className="absolute bottom-3 left-3 rounded-full bg-rose-950/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur">{p.category}</span>
                      </button>
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-bold leading-snug text-rose-950">{p.name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm font-medium text-rose-900/55">{p.description}</p>
                        <div className="mt-auto pt-4">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-pink-600">{formatPrice(p.price)}</span>
                            {p.oldPrice && p.oldPrice > p.price && <span className="font-semibold text-rose-300 line-through">{formatPrice(p.oldPrice)}</span>}
                          </div>
                          <p className={`mt-1 text-xs font-bold ${p.stock <= 0 ? "text-rose-600" : p.stock <= 5 ? "text-amber-600" : "text-emerald-600"}`}>
                            {p.stock <= 0 ? "Sin stock por el momento" : p.stock <= 5 ? `¡Quedan solo ${p.stock}!` : "En stock"}
                          </p>
                          <button
                            disabled={p.stock <= 0}
                            onClick={() => addToCart(p)}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-pink-500 py-3 font-bold text-white shadow-lg shadow-pink-200 transition hover:bg-pink-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-pink-200 disabled:shadow-none"
                          >
                            <ShoppingBag className="h-5 w-5" /> Agregar al carrito
                          </button>
                        </div>
                      </div>
                    </article>
                  </Tilt>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- Cómo comprar ---------- */}
      <section id="como-comprar" className="mx-auto max-w-6xl px-4 py-16">
        <Reveal variant="flip" className="text-center">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-pink-500">Simple y rápido</span>
          <h2 className="font-display mt-1 text-3xl font-black text-rose-950 sm:text-4xl">Comprar es así de fácil</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" style={{ perspective: "1200px" }}>
          {[
            { icon: MousePointerClick, title: "1. Elegí tus favoritos", desc: "Recorré el catálogo y sumá al carrito todo lo que te enamore." },
            { icon: ShoppingBag, title: "2. Revisá tu carrito", desc: "Ajustá cantidades y elegí cómo querés pagar." },
            { icon: Send, title: "3. Pedí por WhatsApp", desc: "Tu pedido nos llega al instante y coordinamos todo por chat." },
            { icon: PackageCheck, title: "4. Recibilo y disfrutá", desc: "Pagás como prefieras y te lo enviamos o lo retirás." },
          ].map((s, i) => (
            <Reveal key={s.title} delay={i * 120} variant="flip">
              <div className="h-full rounded-[1.8rem] border border-pink-100 bg-white p-6 text-center shadow-lg shadow-pink-100">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                  <s.icon className="h-8 w-8" />
                </span>
                <h3 className="mt-4 font-black text-rose-950">{s.title}</h3>
                <p className="mt-1.5 text-sm font-medium text-rose-900/60">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Medios de pago ---------- */}
      <section id="pagos" className="border-y border-pink-100 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal variant="flip" className="text-center">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-pink-500">Pagá como quieras</span>
            <h2 className="font-display mt-1 text-3xl font-black text-rose-950 sm:text-4xl">Medios de pago</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {enabledPayments.map((m, i) => {
              const Icon = paymentIcon(m.name);
              return (
                <Reveal key={m.id} delay={i * 110} variant="zoom">
                  <Tilt max={8} className="h-full">
                    <div className="h-full rounded-[1.8rem] border border-pink-100 bg-[#fff7fa] p-6 shadow-lg shadow-pink-100">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500 text-white shadow-lg shadow-pink-300">
                        <Icon className="h-7 w-7" />
                      </span>
                      <h3 className="mt-4 font-black text-rose-950">{m.name}</h3>
                      <p className="mt-1 text-sm font-medium text-rose-900/60">{m.detail}</p>
                    </div>
                  </Tilt>
                </Reveal>
              );
            })}
          </div>
          <Reveal delay={150}>
            <div className="mt-10 flex flex-col items-center gap-4 rounded-[2rem] bg-pink-500 px-6 py-9 text-center shadow-2xl shadow-pink-300 sm:flex-row sm:text-left">
              <Heart className="h-12 w-12 shrink-0 fill-white text-white" />
              <div className="flex-1">
                <h3 className="font-display text-2xl font-black text-white">¿Tenés dudas o buscás algo especial?</h3>
                <p className="font-medium text-pink-100">Escribinos por WhatsApp y te ayudamos a elegir tu próximo caprichito.</p>
              </div>
              <button
                onClick={() => settings && window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`¡Hola ${storeName}! Tengo una consulta`)}`, "_blank")}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 font-black text-pink-600 shadow-xl transition hover:bg-pink-50 active:scale-95"
              >
                <MessageCircle className="h-5 w-5" /> Chatear ahora
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Footer + ranura de administración ---------- */}
      <footer className="bg-rose-950 text-pink-100">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <StoreLogo logo={settings?.logo ?? ""} name={storeName} size={44} />
              <span className="font-display text-xl font-black text-white">{storeName}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm font-medium text-pink-200/80">{settings?.tagline}</p>
            {settings?.instagram && (
              <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-pink-500">
                <AtSign className="h-4 w-4" /> @{settings.instagram}
              </a>
            )}
          </div>
          <div>
            <h4 className="font-black uppercase tracking-widest text-white">Tienda</h4>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-pink-200/90">
              <li><a href="#productos" className="transition hover:text-white">Productos</a></li>
              <li><a href="#como-comprar" className="transition hover:text-white">Cómo comprar</a></li>
              <li><a href="#pagos" className="transition hover:text-white">Medios de pago</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black uppercase tracking-widest text-white">Ayuda</h4>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-pink-200/90">
              <li className="flex items-center gap-2"><Truck className="h-4 w-4" /> {settings?.shippingNote}</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Cambios dentro de los 7 días</li>
              <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Atención por WhatsApp</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6">
            <p className="text-center text-xs font-semibold text-pink-200/60">© {new Date().getFullYear()} {storeName} · Hecho con amor</p>
            {/* Ranura de acceso a administración */}
            <button
              onClick={() => router.push("/admin")}
              title="Acceso administración"
              aria-label="Acceso administración"
              className="group flex items-center gap-3 rounded-full border border-white/15 bg-white/5 py-1.5 pl-2 pr-4 transition hover:border-pink-400/60 hover:bg-white/10"
            >
              <span className="flex h-6 items-center rounded-full bg-rose-900 px-2 shadow-inner ring-1 ring-white/10 transition group-hover:bg-pink-600">
                <span className="block h-1 w-8 rounded-full bg-pink-300/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] transition group-hover:bg-white" />
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-pink-200/60 transition group-hover:text-pink-100">
                <Lock className="h-3 w-3" /> Administración
              </span>
            </button>
          </div>
        </div>
      </footer>

      {/* Botón flotante WhatsApp */}
      <button
        onClick={() => settings && window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`¡Hola ${storeName}! Quiero hacer una consulta`)}`, "_blank")}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-2xl shadow-green-300 transition hover:scale-110 active:scale-95"
        aria-label="WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </button>

      {/* ---------- Detalle de producto ---------- */}
      {detail && (
        <div className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-rose-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setDetail(null)}>
          <div className="animate-pop grid max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] bg-white sm:rounded-[2rem] md:grid-cols-2" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={detail.image || FALLBACK_IMG} alt={detail.name} className="h-72 w-full object-cover md:h-full" />
              <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-pink-600 shadow">{detail.category}</span>
            </div>
            <div className="flex flex-col p-6 sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-2xl font-black leading-tight text-rose-950">{detail.name}</h3>
                <button onClick={() => setDetail(null)} className="rounded-full bg-pink-50 p-2 text-rose-500 transition hover:bg-pink-100" aria-label="Cerrar"><X className="h-5 w-5" /></button>
              </div>
              <p className="mt-3 font-medium leading-relaxed text-rose-900/65">{detail.description || "Un caprichito hermoso, elegido con amor para vos."}</p>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-3xl font-black text-pink-600">{formatPrice(detail.price)}</span>
                {detail.oldPrice && detail.oldPrice > detail.price && <span className="text-lg font-semibold text-rose-300 line-through">{formatPrice(detail.oldPrice)}</span>}
              </div>
              <p className={`mt-1 text-sm font-bold ${detail.stock <= 5 ? "text-amber-600" : "text-emerald-600"}`}>{detail.stock <= 0 ? "Sin stock" : detail.stock <= 5 ? `¡Quedan solo ${detail.stock}!` : "En stock, listo para vos"}</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex items-center rounded-full border border-pink-200">
                  <button onClick={() => setDetailQty(Math.max(1, detailQty - 1))} className="p-3 text-pink-600 transition hover:text-pink-800" aria-label="Quitar uno"><Minus className="h-4 w-4" /></button>
                  <span className="w-8 text-center font-black">{detailQty}</span>
                  <button onClick={() => setDetailQty(Math.min(99, detailQty + 1))} className="p-3 text-pink-600 transition hover:text-pink-800" aria-label="Agregar uno"><Plus className="h-4 w-4" /></button>
                </div>
                <button
                  disabled={detail.stock <= 0}
                  onClick={() => { addToCart(detail, detailQty); setDetail(null); setCartOpen(true); }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-pink-500 py-3.5 font-bold text-white shadow-lg shadow-pink-300 transition hover:bg-pink-600 active:scale-95 disabled:bg-pink-200"
                >
                  <ShoppingBag className="h-5 w-5" /> Agregar
                </button>
              </div>
              <button
                onClick={() => settings && window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`¡Hola ${storeName}! Me interesa: ${detail.name} (${formatPrice(detail.price)})`)}`, "_blank")}
                className="mt-3 flex items-center justify-center gap-2 rounded-full border-2 border-green-500 py-3 font-bold text-green-600 transition hover:bg-green-50 active:scale-95"
              >
                <MessageCircle className="h-5 w-5" /> Consultar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Carrito ---------- */}
      {cartOpen && (
        <div className="animate-fade fixed inset-0 z-50 bg-rose-950/60 backdrop-blur-sm" onClick={() => setCartOpen(false)}>
          <aside className="animate-drawer absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-pink-100 px-5 py-4">
              <h3 className="font-display flex items-center gap-2 text-xl font-black text-rose-950"><ShoppingBag className="h-6 w-6 text-pink-500" /> Tu carrito</h3>
              <button onClick={() => setCartOpen(false)} className="rounded-full bg-pink-50 p-2 text-rose-500 transition hover:bg-pink-100" aria-label="Cerrar carrito"><X className="h-5 w-5" /></button>
            </div>
            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-pink-50"><ShoppingBag className="h-9 w-9 text-pink-300" /></span>
                <p className="mt-4 font-black text-rose-950">Tu carrito está vacío</p>
                <p className="mt-1 text-sm font-medium text-rose-400">¡Date un capricho! Mirá el catálogo y elegí algo lindo.</p>
                <button onClick={() => setCartOpen(false)} className="mt-5 rounded-full bg-pink-500 px-6 py-3 font-bold text-white shadow-lg shadow-pink-300 transition hover:bg-pink-600">Ver productos</button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {cart.map((i) => (
                    <div key={i.product.id} className="animate-pop flex gap-3 rounded-3xl border border-pink-100 bg-[#fff7fa] p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={i.product.image || FALLBACK_IMG} alt={i.product.name} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-bold leading-tight text-rose-950">{i.product.name}</p>
                          <button onClick={() => setQty(i.product.id, 0)} className="text-rose-300 transition hover:text-rose-600" aria-label="Quitar del carrito"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        <p className="mt-0.5 text-sm font-black text-pink-600">{formatPrice(i.product.price * i.qty)}</p>
                        <div className="mt-2 flex w-max items-center rounded-full border border-pink-200 bg-white">
                          <button onClick={() => setQty(i.product.id, i.qty - 1)} className="p-1.5 px-2 text-pink-600" aria-label="Quitar uno"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-6 text-center text-sm font-black">{i.qty}</span>
                          <button onClick={() => setQty(i.product.id, i.qty + 1)} className="p-1.5 px-2 text-pink-600" aria-label="Agregar uno"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 border-t border-pink-100 px-5 py-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre *" className="rounded-2xl border border-pink-200 bg-pink-50/50 px-4 py-3 text-sm font-semibold outline-none placeholder:text-pink-300 focus:border-pink-400 focus:bg-white" />
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Tu teléfono (opcional)" className="rounded-2xl border border-pink-200 bg-pink-50/50 px-4 py-3 text-sm font-semibold outline-none placeholder:text-pink-300 focus:border-pink-400 focus:bg-white" />
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-xs font-black uppercase tracking-wider text-rose-400">Medio de pago</span>
                    <select value={form.payment} onChange={(e) => setForm({ ...form, payment: e.target.value })} className="w-full rounded-2xl border border-pink-200 bg-pink-50/50 px-4 py-3 text-sm font-semibold outline-none focus:border-pink-400 focus:bg-white">
                      {enabledPayments.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                      <option value="A convenir por WhatsApp">A convenir por WhatsApp</option>
                    </select>
                  </label>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-rose-900">Total</span>
                    <span className="text-2xl font-black text-pink-600">{formatPrice(cartTotal)}</span>
                  </div>
                  <button
                    onClick={checkoutWhatsApp}
                    disabled={sending}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-green-500 py-4 font-black text-white shadow-xl shadow-green-200 transition hover:bg-green-600 active:scale-[0.98] disabled:opacity-60"
                  >
                    <MessageCircle className="h-6 w-6" /> {sending ? "Enviando..." : "Pedir por WhatsApp"}
                  </button>
                  <p className="text-center text-xs font-medium text-rose-400">Al tocar el botón se abre WhatsApp con tu pedido listo para enviar.</p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* ---------- Toast ---------- */}
      {toast && (
        <div className="animate-pop fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-rose-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
