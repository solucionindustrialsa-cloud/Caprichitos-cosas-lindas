"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Lock, LayoutDashboard, Package, ShoppingBag, Users, Settings as SettingsIcon,
  LogOut, Store, Plus, Pencil, Trash2, Eye, EyeOff, Star, TrendingUp, DollarSign,
  Clock, UserCheck, CreditCard, MessageCircle, CheckCircle2, XCircle, Save, Wallet,
  Banknote, Landmark, TriangleAlert, Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { ImagePicker, StoreLogo } from "@/components/ui";
import { formatPrice } from "@/lib/helpers";
import { CATEGORIES, type Order, type PaymentMethod, type Product, type Settings, type Stats } from "@/lib/types";

const PIE_COLORS = ["#ec4899", "#f472b6", "#fb7185", "#f9a8d4", "#e11d48", "#fda4af"];
type Tab = "resumen" | "productos" | "pedidos" | "clientes" | "config";

const emptyProduct = { name: "", description: "", price: "", oldPrice: "", category: "Bolsos", image: "", stock: "10", featured: false, active: true };

export default function AdminPage() {
  const [auth, setAuth] = useState<"checking" | "locked" | "open">("checking");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const [tab, setTab] = useState<Tab>("resumen");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [toast, setToast] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [pform, setPform] = useState(emptyProduct);
  const [savingProduct, setSavingProduct] = useState(false);
  const [sform, setSform] = useState<Settings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const notify = (msg: string) => setToast(msg);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadAll = useCallback(async () => {
    const [s, p, o, st] = await Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/products?all=1").then((r) => r.json()),
      fetch("/api/orders").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/stats").then((r) => (r.ok ? r.json() : null)),
    ]);
    setSettings(s);
    setSform(s);
    setProducts(Array.isArray(p) ? p : []);
    setOrders(Array.isArray(o) ? o : []);
    setStats(st);
  }, []);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then(async (d) => {
        if (d.admin) {
          setAuth("open");
          await loadAll();
        } else setAuth("locked");
      })
      .catch(() => setAuth("locked"));
  }, [loadAll]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginBusy(true);
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoginBusy(false);
    if (res.ok) {
      setAuth("open");
      setPassword("");
      await loadAll();
    } else {
      setLoginError("Contraseña incorrecta. Intentá de nuevo.");
    }
  }

  async function logout() {
    await fetch("/api/admin/me", { method: "DELETE" });
    setAuth("locked");
  }

  /* ---------- Productos ---------- */
  function startEdit(p: Product) {
    setEditingId(p.id);
    setPform({
      name: p.name, description: p.description, price: String(p.price),
      oldPrice: p.oldPrice ? String(p.oldPrice) : "", category: p.category,
      image: p.image, stock: String(p.stock), featured: p.featured, active: p.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setPform(emptyProduct);
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!pform.name.trim()) return notify("El producto necesita un nombre");
    if (!pform.image) return notify("Elegí una imagen desde tu dispositivo");
    setSavingProduct(true);
    const payload = {
      name: pform.name.trim(),
      description: pform.description,
      price: Number(pform.price) || 0,
      oldPrice: pform.oldPrice ? Number(pform.oldPrice) : null,
      category: pform.category,
      image: pform.image,
      stock: Number(pform.stock) || 0,
      featured: pform.featured,
      active: pform.active,
    };
    const res = editingId
      ? await fetch(`/api/products/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSavingProduct(false);
    if (res.ok) {
      notify(editingId ? "Producto actualizado" : "¡Producto agregado a la tienda!");
      resetForm();
      await loadAll();
    } else notify("Hubo un problema al guardar");
  }

  async function deleteProduct(id: number) {
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    if (editingId === id) resetForm();
    notify("Producto eliminado");
    await loadAll();
  }

  async function toggleProduct(p: Product, field: "active" | "featured") {
    await fetch(`/api/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !p[field] }),
    });
    await loadAll();
  }

  /* ---------- Pedidos ---------- */
  async function setOrderStatus(id: number, status: string) {
    await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    notify("Estado del pedido actualizado");
    await loadAll();
  }
  async function deleteOrder(id: number) {
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    notify("Pedido eliminado");
    await loadAll();
  }

  /* ---------- Configuración ---------- */
  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!sform) return;
    setSavingSettings(true);
    const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sform) });
    setSavingSettings(false);
    if (res.ok) {
      const updated = await res.json();
      setSettings(updated);
      setSform(updated);
      notify("Configuración guardada. ¡La tienda ya se ve actualizada!");
    } else notify("No se pudo guardar la configuración");
  }

  function updatePayment(id: string, patch: Partial<PaymentMethod>) {
    if (!sform) return;
    setSform({ ...sform, paymentMethods: sform.paymentMethods.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  }
  function addPayment() {
    if (!sform) return;
    const id = `pago-${Date.now()}`;
    setSform({ ...sform, paymentMethods: [...sform.paymentMethods, { id, name: "Nuevo medio de pago", detail: "", enabled: true }] });
  }
  function removePayment(id: string) {
    if (!sform) return;
    setSform({ ...sform, paymentMethods: sform.paymentMethods.filter((m) => m.id !== id) });
  }

  /* ---------- Pantalla de bloqueo ---------- */
  if (auth === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff7fa]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500" />
      </div>
    );
  }

  if (auth === "locked") {
    return (
      <div className="dot-pattern flex min-h-screen items-center justify-center px-4 py-10">
        <form onSubmit={login} className="animate-pop w-full max-w-md rounded-[2rem] border border-pink-100 bg-white p-8 shadow-2xl shadow-pink-200">
          <span className="animate-pulse-ring mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-500 text-white shadow-xl shadow-pink-300">
            <Lock className="h-9 w-9" />
          </span>
          <h1 className="font-display mt-6 text-center text-3xl font-black text-rose-950">Panel de administración</h1>
          <p className="mt-2 text-center text-sm font-medium text-rose-400">Ingresá la contraseña para gestionar tu tienda</p>
          <label className="mt-7 block">
            <span className="mb-1.5 block text-sm font-bold text-rose-950">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              autoFocus
              className="w-full rounded-2xl border border-pink-200 bg-pink-50/50 px-4 py-3.5 font-semibold outline-none placeholder:text-pink-300 focus:border-pink-400 focus:bg-white"
            />
          </label>
          {loginError && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-center text-sm font-bold text-rose-600">{loginError}</p>}
          <button disabled={loginBusy || !password} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-pink-500 py-3.5 font-black text-white shadow-xl shadow-pink-300 transition hover:bg-pink-600 active:scale-[0.98] disabled:opacity-50">
            <Lock className="h-5 w-5" /> {loginBusy ? "Verificando..." : "Entrar al panel"}
          </button>
          <Link href="/" className="mt-5 block text-center text-sm font-bold text-pink-500 hover:text-pink-700">← Volver a la tienda</Link>
        </form>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "resumen", label: "Resumen", icon: LayoutDashboard },
    { id: "productos", label: "Productos", icon: Package },
    { id: "pedidos", label: "Pedidos", icon: ShoppingBag },
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "config", label: "Configuración", icon: SettingsIcon },
  ];

  const inputCls = "w-full rounded-2xl border border-pink-200 bg-pink-50/40 px-4 py-3 text-sm font-semibold outline-none placeholder:text-pink-300 focus:border-pink-400 focus:bg-white";
  const labelCls = "mb-1.5 block text-sm font-bold text-rose-950";

  return (
    <div className="min-h-screen bg-[#fff7fa]">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-pink-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <StoreLogo logo={settings?.logo ?? ""} name={settings?.storeName ?? "C"} size={42} />
          <div className="min-w-0">
            <p className="truncate font-black leading-tight text-rose-950">{settings?.storeName}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-pink-500">Panel de administración</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-800 transition hover:bg-pink-50">
              <Store className="h-4 w-4" /> <span className="hidden sm:inline">Ver tienda</span>
            </Link>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-full bg-rose-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-800">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1.5 overflow-x-auto px-4 pb-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition active:scale-95 ${
                tab === t.id ? "bg-pink-500 text-white shadow-lg shadow-pink-300" : "bg-white text-rose-800 ring-1 ring-pink-200 hover:bg-pink-50"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
              {t.id === "pedidos" && stats && stats.totals.pendingOrders > 0 && (
                <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-black ${tab === t.id ? "bg-white text-pink-600" : "bg-pink-500 text-white"}`}>{stats.totals.pendingOrders}</span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* ============ RESUMEN ============ */}
        {tab === "resumen" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Ingresos (ventas cerradas)", value: formatPrice(stats?.totals.revenue ?? 0), icon: DollarSign, color: "bg-pink-500" },
                { label: "Pedidos totales", value: String(stats?.totals.orders ?? 0), icon: ShoppingBag, color: "bg-rose-500" },
                { label: "Pedidos pendientes", value: String(stats?.totals.pendingOrders ?? 0), icon: Clock, color: "bg-amber-500" },
                { label: "Clientas registradas", value: String(stats?.totals.clients ?? 0), icon: UserCheck, color: "bg-pink-400" },
                { label: "Ticket promedio", value: formatPrice(stats?.totals.avgTicket ?? 0), icon: TrendingUp, color: "bg-rose-400" },
                { label: "Productos en tienda", value: String(stats?.totals.products ?? 0), icon: Package, color: "bg-pink-600" },
                { label: "Ventas completadas", value: String(stats?.totals.completedOrders ?? 0), icon: CheckCircle2, color: "bg-emerald-500" },
                { label: "Con stock bajo (≤5)", value: String(stats?.totals.lowStock ?? 0), icon: TriangleAlert, color: "bg-orange-500" },
              ].map((c) => (
                <div key={c.label} className="animate-pop rounded-[1.6rem] border border-pink-100 bg-white p-5 shadow-lg shadow-pink-100">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg ${c.color}`}><c.icon className="h-5 w-5" /></span>
                  <p className="mt-3 text-2xl font-black text-rose-950">{c.value}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-400">{c.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-[1.6rem] border border-pink-100 bg-white p-5 shadow-lg shadow-pink-100 lg:col-span-2">
                <h3 className="flex items-center gap-2 font-black text-rose-950"><TrendingUp className="h-5 w-5 text-pink-500" /> Ventas de los últimos 14 días</h3>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.salesByDay ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="pinkFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ec4899" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#ec4899" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fbcfe8" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9f1239" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9f1239" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`} width={48} />
                      <Tooltip formatter={(v) => [formatPrice(Number(v ?? 0)), "Ventas"]} contentStyle={{ borderRadius: 16, border: "1px solid #fbcfe8", fontWeight: 700 }} />
                      <Area type="monotone" dataKey="ventas" stroke="#ec4899" strokeWidth={3} fill="url(#pinkFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-pink-100 bg-white p-5 shadow-lg shadow-pink-100">
                <h3 className="flex items-center gap-2 font-black text-rose-950"><Sparkles className="h-5 w-5 text-pink-500" /> Ventas por categoría</h3>
                <div className="mt-2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stats?.byCategory ?? []} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                        {(stats?.byCategory ?? []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#fff" strokeWidth={2} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatPrice(Number(v ?? 0))} contentStyle={{ borderRadius: 16, border: "1px solid #fbcfe8", fontWeight: 700 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-1.5">
                  {(stats?.byCategory ?? []).map((c, i) => (
                    <li key={c.name} className="flex items-center gap-2 text-sm font-bold text-rose-900">
                      <span className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {c.name} <span className="ml-auto text-pink-600">{formatPrice(c.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[1.6rem] border border-pink-100 bg-white p-5 shadow-lg shadow-pink-100">
                <h3 className="flex items-center gap-2 font-black text-rose-950"><Wallet className="h-5 w-5 text-pink-500" /> Ingresos por medio de pago</h3>
                <div className="mt-4 h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.byPayment ?? []} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fbcfe8" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#9f1239" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#9f1239", fontWeight: 700 }} axisLine={false} tickLine={false} width={130} />
                      <Tooltip formatter={(v) => [formatPrice(Number(v ?? 0)), "Ingresos"]} contentStyle={{ borderRadius: 16, border: "1px solid #fbcfe8", fontWeight: 700 }} />
                      <Bar dataKey="value" fill="#ec4899" radius={[0, 10, 10, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-pink-100 bg-white p-5 shadow-lg shadow-pink-100">
                <h3 className="flex items-center gap-2 font-black text-rose-950"><Star className="h-5 w-5 text-pink-500" /> Productos más vendidos</h3>
                <ul className="mt-4 space-y-3">
                  {(stats?.topProducts ?? []).map((p, i) => (
                    <li key={p.name} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-black text-pink-600">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-rose-950">{p.name}</span>
                        <span className="text-xs font-semibold text-rose-400">{p.unidades} unidades vendidas</span>
                      </span>
                      <span className="font-black text-pink-600">{formatPrice(p.ingresos)}</span>
                    </li>
                  ))}
                  {(stats?.topProducts ?? []).length === 0 && <li className="py-6 text-center text-sm font-semibold text-rose-300">Todavía no hay ventas completadas</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ============ PRODUCTOS ============ */}
        {tab === "productos" && (
          <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <form onSubmit={saveProduct} className="h-max rounded-[1.6rem] border border-pink-100 bg-white p-6 shadow-lg shadow-pink-100 lg:sticky lg:top-36">
              <h3 className="flex items-center gap-2 font-black text-rose-950">
                {editingId ? <Pencil className="h-5 w-5 text-pink-500" /> : <Plus className="h-5 w-5 text-pink-500" />}
                {editingId ? "Editar producto" : "Agregar producto"}
              </h3>
              <div className="mt-5 space-y-4">
                <ImagePicker label="Foto del producto (desde tu dispositivo)" value={pform.image} onChange={(v) => setPform({ ...pform, image: v })} />
                <div>
                  <label className={labelCls} htmlFor="p-name">Nombre *</label>
                  <input id="p-name" value={pform.name} onChange={(e) => setPform({ ...pform, name: e.target.value })} placeholder="Ej: Bolso rosa con cadena" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="p-desc">Descripción</label>
                  <textarea id="p-desc" value={pform.description} onChange={(e) => setPform({ ...pform, description: e.target.value })} rows={3} placeholder="Contá por qué es hermoso..." className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} htmlFor="p-price">Precio ($)</label>
                    <input id="p-price" type="number" min="0" value={pform.price} onChange={(e) => setPform({ ...pform, price: e.target.value })} placeholder="15000" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="p-old">Precio anterior</label>
                    <input id="p-old" type="number" min="0" value={pform.oldPrice} onChange={(e) => setPform({ ...pform, oldPrice: e.target.value })} placeholder="Opcional" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="p-cat">Categoría</label>
                    <select id="p-cat" value={pform.category} onChange={(e) => setPform({ ...pform, category: e.target.value })} className={inputCls}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      {!CATEGORIES.includes(pform.category as typeof CATEGORIES[number]) && pform.category && <option value={pform.category}>{pform.category}</option>}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="p-stock">Stock</label>
                    <input id="p-stock" type="number" min="0" value={pform.stock} onChange={(e) => setPform({ ...pform, stock: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-rose-900">
                    <input type="checkbox" checked={pform.featured} onChange={(e) => setPform({ ...pform, featured: e.target.checked })} className="h-5 w-5 accent-pink-500" /> Destacado
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-rose-900">
                    <input type="checkbox" checked={pform.active} onChange={(e) => setPform({ ...pform, active: e.target.checked })} className="h-5 w-5 accent-pink-500" /> Visible en la tienda
                  </label>
                </div>
                <div className="flex gap-2 pt-1">
                  <button disabled={savingProduct} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-pink-500 py-3.5 font-black text-white shadow-lg shadow-pink-300 transition hover:bg-pink-600 active:scale-[0.98] disabled:opacity-60">
                    <Save className="h-5 w-5" /> {savingProduct ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar producto"}
                  </button>
                  {editingId && (
                    <button type="button" onClick={resetForm} className="rounded-full border border-pink-200 px-5 font-bold text-rose-700 transition hover:bg-pink-50">Cancelar</button>
                  )}
                </div>
              </div>
            </form>

            <div className="rounded-[1.6rem] border border-pink-100 bg-white p-6 shadow-lg shadow-pink-100">
              <h3 className="font-black text-rose-950">Productos de la tienda <span className="ml-1 rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-black text-pink-600">{products.length}</span></h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {products.map((p) => (
                  <article key={p.id} className={`overflow-hidden rounded-3xl border ${p.active ? "border-pink-100" : "border-rose-100 opacity-70"} bg-[#fff7fa]`}>
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image || "/images/hero-bag.png"} alt={p.name} className="h-40 w-full object-cover" />
                      <span className="absolute left-3 top-3 rounded-full bg-rose-950/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">{p.category}</span>
                      {p.featured && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-pink-600"><Star className="h-3 w-3 fill-pink-500 text-pink-500" /> TOP</span>}
                      {!p.active && <span className="absolute bottom-3 left-3 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-black uppercase text-white">Oculto</span>}
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-1 font-bold text-rose-950">{p.name}</p>
                      <p className="mt-0.5 text-sm">
                        <span className="font-black text-pink-600">{formatPrice(p.price)}</span>
                        {p.oldPrice ? <span className="ml-2 font-semibold text-rose-300 line-through">{formatPrice(p.oldPrice)}</span> : null}
                        <span className={`ml-2 text-xs font-bold ${p.stock <= 5 ? "text-amber-600" : "text-emerald-600"}`}>Stock: {p.stock}</span>
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <button onClick={() => startEdit(p)} className="inline-flex items-center gap-1.5 rounded-full bg-pink-500 px-3.5 py-2 text-xs font-black text-white transition hover:bg-pink-600"><Pencil className="h-3.5 w-3.5" /> Editar</button>
                        <button onClick={() => toggleProduct(p, "active")} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-black text-rose-700 ring-1 ring-pink-200 transition hover:bg-pink-50">
                          {p.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {p.active ? "Ocultar" : "Mostrar"}
                        </button>
                        <button onClick={() => toggleProduct(p, "featured")} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-black text-rose-700 ring-1 ring-pink-200 transition hover:bg-pink-50"><Star className="h-3.5 w-3.5" /> {p.featured ? "Quitar TOP" : "Destacar"}</button>
                        {confirmDelete === p.id ? (
                          <>
                            <button onClick={() => deleteProduct(p.id)} className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-2 text-xs font-black text-white">Confirmar</button>
                            <button onClick={() => setConfirmDelete(null)} className="rounded-full bg-white px-3.5 py-2 text-xs font-black text-rose-700 ring-1 ring-pink-200">No</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmDelete(p.id)} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-black text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
                {products.length === 0 && <p className="col-span-full py-10 text-center font-semibold text-rose-300">Todavía no hay productos. ¡Agregá el primero!</p>}
              </div>
            </div>
          </div>
        )}

        {/* ============ PEDIDOS ============ */}
        {tab === "pedidos" && (
          <div className="rounded-[1.6rem] border border-pink-100 bg-white p-6 shadow-lg shadow-pink-100">
            <h3 className="font-black text-rose-950">Pedidos recibidos por WhatsApp <span className="ml-1 rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-black text-pink-600">{orders.length}</span></h3>
            <p className="mt-1 text-sm font-medium text-rose-400">Marcá un pedido como completado cuando la venta se concrete: así suma a las gráficas de ingresos.</p>
            <div className="mt-5 space-y-3">
              {orders.map((o) => (
                <article key={o.id} className="rounded-3xl border border-pink-100 bg-[#fff7fa] p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-rose-950">{o.customerName} <span className="ml-1 text-xs font-bold text-rose-300">#{o.id}</span></p>
                      <p className="text-xs font-semibold text-rose-400">{new Date(o.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} · {o.paymentMethod}</p>
                      <ul className="mt-2 space-y-0.5">
                        {(o.items ?? []).map((it, idx) => (
                          <li key={idx} className="text-sm font-semibold text-rose-900/80">• {it.name} <span className="text-rose-400">x{it.quantity}</span> — {formatPrice(it.price * it.quantity)}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-pink-600">{formatPrice(o.total)}</p>
                      <span className={`mt-1 inline-block rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ${
                        o.status === "completado" ? "bg-emerald-100 text-emerald-700" : o.status === "cancelado" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                      }`}>{o.status}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {o.customerPhone && (
                      <a href={`https://wa.me/${o.customerPhone.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-green-500 px-3.5 py-2 text-xs font-black text-white transition hover:bg-green-600"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
                    )}
                    {o.status !== "completado" && (
                      <button onClick={() => setOrderStatus(o.id, "completado")} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-2 text-xs font-black text-white transition hover:bg-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Completar venta</button>
                    )}
                    {o.status !== "pendiente" && (
                      <button onClick={() => setOrderStatus(o.id, "pendiente")} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-black text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-50"><Clock className="h-3.5 w-3.5" /> Pendiente</button>
                    )}
                    {o.status !== "cancelado" && (
                      <button onClick={() => setOrderStatus(o.id, "cancelado")} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-black text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50"><XCircle className="h-3.5 w-3.5" /> Cancelar</button>
                    )}
                    <button onClick={() => deleteOrder(o.id)} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-black text-rose-400 ring-1 ring-pink-100 transition hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /> Eliminar</button>
                  </div>
                </article>
              ))}
              {orders.length === 0 && <p className="py-10 text-center font-semibold text-rose-300">Todavía no llegaron pedidos. Cuando una clienta pida por WhatsApp, aparece acá.</p>}
            </div>
          </div>
        )}

        {/* ============ CLIENTES ============ */}
        {tab === "clientes" && (
          <div className="rounded-[1.6rem] border border-pink-100 bg-white p-6 shadow-lg shadow-pink-100">
            <h3 className="font-black text-rose-950">Clientas <span className="ml-1 rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-black text-pink-600">{stats?.clients.length ?? 0}</span></h3>
            <p className="mt-1 text-sm font-medium text-rose-400">Se registran automáticamente con cada pedido. Ordenadas por total comprado.</p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-pink-100 text-xs font-black uppercase tracking-wider text-rose-400">
                    <th className="pb-3 pr-4">Clienta</th>
                    <th className="pb-3 pr-4">Teléfono</th>
                    <th className="pb-3 pr-4">Pedidos</th>
                    <th className="pb-3 pr-4">Total comprado</th>
                    <th className="pb-3 pr-4">Último pedido</th>
                    <th className="pb-3">Contacto</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.clients ?? []).map((c) => (
                    <tr key={c.phone + c.name} className="border-b border-pink-50 last:border-0">
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 font-black text-pink-600">{c.name.charAt(0).toUpperCase()}</span>
                          <span className="font-bold text-rose-950">{c.name}</span>
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-rose-700">{c.phone || "—"}</td>
                      <td className="py-3 pr-4 font-bold text-rose-900">{c.orders}</td>
                      <td className="py-3 pr-4 font-black text-pink-600">{formatPrice(c.spent)}</td>
                      <td className="py-3 pr-4 font-semibold text-rose-500">{new Date(c.lastOrder).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="py-3">
                        {c.phone ? (
                          <a href={`https://wa.me/${c.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-green-500 px-3.5 py-2 text-xs font-black text-white transition hover:bg-green-600"><MessageCircle className="h-3.5 w-3.5" /> Escribir</a>
                        ) : <span className="text-rose-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(stats?.clients ?? []).length === 0 && <p className="py-10 text-center font-semibold text-rose-300">Todavía no hay clientas registradas.</p>}
            </div>
          </div>
        )}

        {/* ============ CONFIGURACIÓN ============ */}
        {tab === "config" && sform && (
          <form onSubmit={saveSettings} className="grid gap-6 lg:grid-cols-2">
            <div className="h-max rounded-[1.6rem] border border-pink-100 bg-white p-6 shadow-lg shadow-pink-100">
              <h3 className="flex items-center gap-2 font-black text-rose-950"><Store className="h-5 w-5 text-pink-500" /> Identidad de la tienda</h3>
              <div className="mt-5 space-y-4">
                <ImagePicker label="Logotipo (desde tu dispositivo)" value={sform.logo} onChange={(v) => setSform({ ...sform, logo: v })} />
                <div>
                  <label className={labelCls} htmlFor="s-name">Nombre de la tienda</label>
                  <input id="s-name" value={sform.storeName} onChange={(e) => setSform({ ...sform, storeName: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="s-tag">Frase principal (eslogan)</label>
                  <input id="s-tag" value={sform.tagline} onChange={(e) => setSform({ ...sform, tagline: e.target.value })} className={inputCls} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls} htmlFor="s-wa">WhatsApp (con código de país)</label>
                    <input id="s-wa" value={sform.whatsapp} onChange={(e) => setSform({ ...sform, whatsapp: e.target.value })} placeholder="5491123456789" className={inputCls} />
                    <p className="mt-1 text-xs font-medium text-rose-400">A este número llegan todos los pedidos.</p>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="s-ig">Usuario de Instagram</label>
                    <input id="s-ig" value={sform.instagram} onChange={(e) => setSform({ ...sform, instagram: e.target.value })} placeholder="caprichitos_cosas_lindas" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls} htmlFor="s-ship">Nota de envíos</label>
                  <input id="s-ship" value={sform.shippingNote} onChange={(e) => setSform({ ...sform, shippingNote: e.target.value })} className={inputCls} />
                </div>
                <div className="rounded-2xl bg-pink-50 p-4">
                  <p className="text-sm font-bold text-rose-900">Vista previa</p>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                    <StoreLogo logo={sform.logo} name={sform.storeName} size={46} />
                    <div className="min-w-0">
                      <p className="truncate font-black text-rose-950">{sform.storeName || "Nombre de tu tienda"}</p>
                      <p className="truncate text-xs font-semibold text-pink-500">{sform.tagline}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-max rounded-[1.6rem] border border-pink-100 bg-white p-6 shadow-lg shadow-pink-100">
              <h3 className="flex items-center gap-2 font-black text-rose-950"><CreditCard className="h-5 w-5 text-pink-500" /> Medios de pago</h3>
              <p className="mt-1 text-sm font-medium text-rose-400">Estos son los medios que ven tus clientas en la tienda y en el carrito.</p>
              <div className="mt-5 space-y-3">
                {sform.paymentMethods.map((m) => (
                  <div key={m.id} className={`rounded-3xl border p-4 ${m.enabled ? "border-pink-200 bg-[#fff7fa]" : "border-pink-100 bg-white opacity-70"}`}>
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500 text-white">
                        {m.name.toLowerCase().includes("efectivo") ? <Banknote className="h-5 w-5" /> : m.name.toLowerCase().includes("transferencia") ? <Landmark className="h-5 w-5" /> : m.name.toLowerCase().includes("mercado") ? <Wallet className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                      </span>
                      <input value={m.name} onChange={(e) => updatePayment(m.id, { name: e.target.value })} className="min-w-0 flex-1 rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-pink-400" aria-label="Nombre del medio de pago" />
                      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-black text-rose-700">
                        <input type="checkbox" checked={m.enabled} onChange={(e) => updatePayment(m.id, { enabled: e.target.checked })} className="h-5 w-5 accent-pink-500" /> Activo
                      </label>
                      <button type="button" onClick={() => removePayment(m.id)} className="shrink-0 rounded-full bg-white p-2 text-rose-500 ring-1 ring-rose-200 transition hover:bg-rose-50" aria-label="Eliminar medio de pago"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <input value={m.detail} onChange={(e) => updatePayment(m.id, { detail: e.target.value })} placeholder="Detalle para la clienta (alias, cuotas, etc.)" className="mt-2.5 w-full rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-pink-400" aria-label="Detalle del medio de pago" />
                  </div>
                ))}
              </div>
              <button type="button" onClick={addPayment} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 border-dashed border-pink-300 py-3.5 font-black text-pink-600 transition hover:bg-pink-50">
                <Plus className="h-5 w-5" /> Agregar medio de pago
              </button>
              <button disabled={savingSettings} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-pink-500 py-4 font-black text-white shadow-xl shadow-pink-300 transition hover:bg-pink-600 active:scale-[0.98] disabled:opacity-60">
                <Save className="h-5 w-5" /> {savingSettings ? "Guardando..." : "Guardar toda la configuración"}
              </button>
            </div>
          </form>
        )}
      </main>

      {toast && (
        <div className="animate-pop fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-rose-950 px-5 py-3 text-sm font-bold text-white shadow-2xl">{toast}</div>
      )}
    </div>
  );
}
