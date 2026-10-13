/**
 * Helpers compartidos de la tienda.
 *
 * Funciones puras y reutilizables tanto en componentes cliente como en el
 * servidor. Ruta canónica: "@/lib/helpers" (alias "@/*" -> "./src/*").
 */

/** Formatea un monto en pesos argentinos, sin decimales. Ej: 15000 -> "$ 15.000" */
export function formatPrice(v: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(v);
}
