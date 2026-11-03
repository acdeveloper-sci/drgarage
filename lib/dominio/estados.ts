// Estados del auto, en el orden en que se muestran (botones del taller y stepper del cliente).
export const ESTADOS = ["recibido", "proceso", "cotizacion", "listo"] as const;

export type Estado = (typeof ESTADOS)[number];

export const ETIQUETAS_ESTADO: Record<Estado, string> = {
  recibido: "Recibido",
  proceso: "En proceso",
  cotizacion: "Cotización enviada",
  listo: "Listo",
};

export function esEstado(valor: unknown): valor is Estado {
  return typeof valor === "string" && (ESTADOS as readonly string[]).includes(valor);
}
