import { describe, expect, it } from "vitest";
import { ESTADOS_COTIZACION } from "./cotizaciones";
import { DESCRIPCIONES_ESTADO, ESTADOS, descripcionEstado } from "./estados";

describe("descripcionEstado (8.5)", () => {
  it("Cotización enviada con cotización pendiente: texto del prototipo", () => {
    expect(descripcionEstado("cotizacion", "pendiente")).toBe("Hay una reparación adicional esperando tu aprobación.");
  });

  it("Cotización enviada con una decidida: confirma la respuesta, sin pedir aprobar", () => {
    expect(descripcionEstado("cotizacion", "aprobada")).toBe("Recibimos tu respuesta sobre la reparación adicional.");
    expect(descripcionEstado("cotizacion", "rechazada")).toBe("Recibimos tu respuesta sobre la reparación adicional.");
  });

  it("Cotización enviada sin cotización (estado puesto a mano): texto del feature 01", () => {
    expect(descripcionEstado("cotizacion")).toBe("Te enviamos una cotización por una reparación adicional. Respóndenos por WhatsApp.");
    expect(descripcionEstado("cotizacion", "anulada")).toBe(DESCRIPCIONES_ESTADO.cotizacion);
  });

  it("los demás estados conservan los textos del feature 01, haya o no cotización", () => {
    const feature01 = {
      recibido: "Tu vehículo ya está en el taller, en espera de revisión.",
      proceso: "Nuestros mecánicos están trabajando en tu vehículo.",
      listo: "Tu vehículo está listo. Puedes pasar a recogerlo.",
    } as const;
    for (const estado of ESTADOS.filter((e) => e !== "cotizacion")) {
      expect(descripcionEstado(estado)).toBe(feature01[estado as keyof typeof feature01]);
      for (const c of ESTADOS_COTIZACION) expect(descripcionEstado(estado, c)).toBe(feature01[estado as keyof typeof feature01]);
    }
  });
});
