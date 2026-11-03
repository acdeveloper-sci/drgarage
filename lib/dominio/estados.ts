// Estados del auto, en el orden en que se muestran (botones del taller y stepper del cliente).
export const ESTADOS = ["recibido", "proceso", "cotizacion", "listo"] as const;

export type Estado = (typeof ESTADOS)[number];

export const ETIQUETAS_ESTADO: Record<Estado, string> = {
  recibido: "Recibido",
  proceso: "En proceso",
  cotizacion: "Cotización enviada",
  listo: "Listo",
};

// Lo que significa cada estado para el cliente (textos del prototipo).
export const DESCRIPCIONES_ESTADO: Record<Estado, string> = {
  recibido: "Tu vehículo ya está en el taller, en espera de revisión.",
  proceso: "Nuestros mecánicos están trabajando en tu vehículo.",
  cotizacion: "Hay una reparación adicional esperando tu aprobación.",
  listo: "Tu vehículo está listo. Puedes pasar a recogerlo.",
};

export function esEstado(valor: unknown): valor is Estado {
  return typeof valor === "string" && (ESTADOS as readonly string[]).includes(valor);
}
