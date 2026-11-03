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
// este es el texto sin cotización pendiente (ya decidida o estado puesto a mano): no pide aprobar nada.
export const DESCRIPCIONES_ESTADO: Record<Estado, string> = {
  recibido: "Tu vehículo ya está en el taller, en espera de revisión.",
  proceso: "Nuestros mecánicos están trabajando en tu vehículo.",
  cotizacion: "El taller está revisando una reparación adicional para tu vehículo.",
  listo: "Tu vehículo está listo. Puedes pasar a recogerlo.",
};

// Texto del prototipo para "Cotización enviada" cuando hay una cotización esperando decisión.
export const DESCRIPCION_COTIZACION_PENDIENTE = "Hay una reparación adicional esperando tu aprobación.";

// Descripción que ve el cliente (design.md, sección 2.4).
export function descripcionEstado(estado: Estado, hayCotizacionPendiente: boolean): string {
  return estado === "cotizacion" && hayCotizacionPendiente ? DESCRIPCION_COTIZACION_PENDIENTE : DESCRIPCIONES_ESTADO[estado];
}

export function esEstado(valor: unknown): valor is Estado {
  return typeof valor === "string" && (ESTADOS as readonly string[]).includes(valor);
}
