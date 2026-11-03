// Reglas de las cotizaciones de reparaciones adicionales (funciones puras, sin red).

export const ESTADOS_COTIZACION = ["pendiente", "aprobada", "rechazada", "anulada"] as const;

export type EstadoCotizacion = (typeof ESTADOS_COTIZACION)[number];

export type DecisionCotizacion = "aprobar" | "rechazar";

// Atajos de la nota de rechazo (textos del prototipo).
export const ATAJOS_NOTA = ["Muy costoso por ahora", "Prefiero revisarlo después", "Solo lo reportado"] as const;

export function esEstadoCotizacion(valor: unknown): valor is EstadoCotizacion {
  return typeof valor === "string" && (ESTADOS_COTIZACION as readonly string[]).includes(valor);
}

// Una cotización pendiente puede pasar a cualquier otro estado; una decidida o anulada es final.
export function transicionValida(actual: EstadoCotizacion, nuevo: EstadoCotizacion): boolean {
  return actual === "pendiente" && nuevo !== "pendiente";
}

export function esFinal(estado: EstadoCotizacion): boolean {
  return estado !== "pendiente";
}

// Regla de la decisión única: solo una cotización pendiente acepta decisión; en cualquier otro
// caso no se modifica nada y se devuelve el estado existente (idempotencia).
export function resolverDecision(
  actual: EstadoCotizacion,
  decision: DecisionCotizacion,
): { aplicar: boolean; resultado: EstadoCotizacion } {
  if (actual !== "pendiente") return { aplicar: false, resultado: actual };
  return { aplicar: true, resultado: decision === "aprobar" ? "aprobada" : "rechazada" };
}

// ---- Costo, validación del formulario y nota ----

// Textos del prototipo (design/prototipo/prototipo.html, f-quote).
export const ERROR_DESCRIPCION = "Escribe la descripción de la reparación.";
export const ERROR_COSTO = "Escribe el costo en pesos, solo números.";

export const MAXIMO_NOTA = 140;

// "$380.000", "380.000" o "380000" -> 380000. Los puntos solo valen como separador de miles.
// Más estricta que el prototipo: "380,5" o "12.5" no son válidos (design.md, sección 14).
export function parsearCosto(texto: string): number | null {
  const limpio = texto.replace(/[\s$]/g, "");
  if (!/^(\d+|\d{1,3}(\.\d{3})+)$/.test(limpio)) return null;
  const n = Number(limpio.replace(/\./g, ""));
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// 380000 -> "$380.000" (sin depender de Intl, que varía entre versiones de ICU).
export function formatearCostoCop(n: number): string {
  return "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export type ResultadoCotizacion =
  | { ok: true; descripcion: string; costoCop: number }
  | { ok: false; errores: { descripcion?: string; costo?: string } };

export function validarCotizacion(entrada: { descripcion: string; costo: string }): ResultadoCotizacion {
  const descripcion = entrada.descripcion.trim();
  const costoCop = parsearCosto(entrada.costo);
  const errores: { descripcion?: string; costo?: string } = {};
  if (!descripcion) errores.descripcion = ERROR_DESCRIPCION;
  if (costoCop === null) errores.costo = ERROR_COSTO;
  if (errores.descripcion || errores.costo || costoCop === null) return { ok: false, errores };
  return { ok: true, descripcion, costoCop };
}

export type ResultadoNota = { ok: true; nota?: string } | { ok: false };

// La nota es opcional: vacía (o solo espacios) queda sin nota. Se cuentan caracteres como
// Postgres (char_length), no unidades UTF-16, para que una nota válida aquí lo sea en la base.
export function validarNota(texto: string): ResultadoNota {
  const nota = texto.trim();
  if (!nota) return { ok: true };
  return [...nota].length <= MAXIMO_NOTA ? { ok: true, nota } : { ok: false };
}
