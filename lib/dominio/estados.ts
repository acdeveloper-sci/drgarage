import type { EstadoCotizacion } from "./cotizaciones";

// Estados del auto, en el orden en que se muestran (botones del taller y stepper del cliente).
export const ESTADOS = ["recibido", "proceso", "cotizacion", "listo"] as const;

export type Estado = (typeof ESTADOS)[number];

export const ETIQUETAS_ESTADO: Record<Estado, string> = {
  recibido: "Recibido",
  proceso: "En proceso",
  cotizacion: "Cotización enviada",
  listo: "Listo",
};

// Lo que significa cada estado para el cliente (textos del prototipo). Para "Cotización enviada"
// este es el texto del feature 01, que se usa cuando el auto no tiene cotización (estado puesto a mano).
export const DESCRIPCIONES_ESTADO: Record<Estado, string> = {
  recibido: "Tu vehículo ya está en el taller, en espera de revisión.",
  proceso: "Nuestros mecánicos están trabajando en tu vehículo.",
  cotizacion: "Te enviamos una cotización por una reparación adicional. Respóndenos por WhatsApp.",
  listo: "Tu vehículo está listo. Puedes pasar a recogerlo.",
};

// "Cotización enviada" con una cotización esperando decisión (texto del prototipo) o ya decidida.
export const DESCRIPCION_COTIZACION_PENDIENTE = "Hay una reparación adicional esperando tu aprobación.";
export const DESCRIPCION_COTIZACION_DECIDIDA = "Recibimos tu respuesta sobre la reparación adicional.";

// Descripción que ve el cliente según la cotización más reciente no anulada (design.md, sección 2.4).
export function descripcionEstado(estado: Estado, estadoCotizacion?: EstadoCotizacion): string {
  if (estado !== "cotizacion") return DESCRIPCIONES_ESTADO[estado];
  if (estadoCotizacion === "pendiente") return DESCRIPCION_COTIZACION_PENDIENTE;
  if (estadoCotizacion === "aprobada" || estadoCotizacion === "rechazada") return DESCRIPCION_COTIZACION_DECIDIDA;
  return DESCRIPCIONES_ESTADO.cotizacion;
}

export function esEstado(valor: unknown): valor is Estado {
  return typeof valor === "string" && (ESTADOS as readonly string[]).includes(valor);
}
