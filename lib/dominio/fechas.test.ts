import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { formatearFecha } from "./fechas";

describe("formatearFecha", () => {
  it.each([
    ["2026-11-02T15:42:00Z", "2 nov, 10:42 a. m."], // ejemplo del design
    ["2026-05-15T17:00:00Z", "15 may, 12:00 p. m."], // mediodía
    ["2026-09-09T05:05:00Z", "9 sept, 12:05 a. m."], // medianoche en Bogotá
    ["2026-01-01T03:07:00Z", "31 dic, 10:07 p. m."], // en UTC ya es otro día y otro año
  ])("muestra %s en America/Bogota como %j", (utc, esperado) => {
    expect(formatearFecha(new Date(utc))).toBe(esperado);
  });

  it("usa la hora de Bogotá (UTC−5, sin horario de verano), no la del equipo", () => {
    fc.assert(
      fc.property(fc.date({ min: new Date("2000-01-01Z"), max: new Date("2100-01-01Z"), noInvalidDate: true }), (fecha) => {
        const bogota = new Date(fecha.getTime() - 5 * 3600_000);
        const h = bogota.getUTCHours();
        const hora12 = h % 12 === 0 ? 12 : h % 12;
        const minutos = String(bogota.getUTCMinutes()).padStart(2, "0");
        const periodo = h < 12 ? "a. m." : "p. m.";
        expect(formatearFecha(fecha)).toMatch(new RegExp(`^${bogota.getUTCDate()} [a-z]{3,4}, ${hora12}:${minutos} ${periodo.replace(/\./g, "\.")}$`));
      }),
    );
  });

  it("siempre tiene el formato es-CO corto, con espacios normales", () => {
    fc.assert(
      fc.property(fc.date({ min: new Date("2000-01-01Z"), max: new Date("2100-01-01Z"), noInvalidDate: true }), (fecha) => {
        const texto = formatearFecha(fecha);
        expect(texto).toMatch(/^\d{1,2} (ene|feb|mar|abr|may|jun|jul|ago|sept|oct|nov|dic), \d{1,2}:\d{2} [ap]\. m\.$/);
        expect(texto).not.toMatch(/[\u00a0\u202f]/);
      }),
    );
  });
});
