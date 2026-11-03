import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { ESTADOS } from "./estados";
import type { Auto } from "./tipos";
import { aAutoPublico } from "./transformaciones";

const autoArbitrario: fc.Arbitrary<Auto> = fc.record(
  {
    id: fc.uuid(),
    tokenPublico: fc.stringMatching(/^[A-Za-z0-9_-]{43}$/),
    nombreCliente: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    whatsapp: fc.stringMatching(/^[0-9]{10}$/),
    placa: fc.string(),
    modelo: fc.string(),
    problema: fc.string(),
    estado: fc.constantFrom(...ESTADOS),
    creadoEn: fc.date({ noInvalidDate: true }),
    actualizadoEn: fc.date({ noInvalidDate: true }),
  },
  { requiredKeys: ["id", "tokenPublico", "nombreCliente", "whatsapp", "placa", "modelo", "estado", "creadoEn", "actualizadoEn"] },
);

describe("aAutoPublico (Property 3)", () => {
  it("devuelve solo primerNombre, placa, modelo, estado y actualizadoEn", () => {
    fc.assert(
      fc.property(autoArbitrario, (auto) => {
        const publico = aAutoPublico(auto);
        expect(Object.keys(publico).sort()).toEqual(["actualizadoEn", "estado", "modelo", "placa", "primerNombre"]);
        expect(publico).toEqual({
          primerNombre: auto.nombreCliente.trim().split(/\s+/)[0],
          placa: auto.placa,
          modelo: auto.modelo,
          estado: auto.estado,
          actualizadoEn: auto.actualizadoEn,
        });
      }),
    );
  });

  it("nunca incluye el WhatsApp ni otros datos internos", () => {
    fc.assert(
      fc.property(autoArbitrario, (auto) => {
        const publico = aAutoPublico(auto) as unknown as Record<string, unknown>;
        for (const interno of ["whatsapp", "id", "tokenPublico", "nombreCliente", "problema", "creadoEn"]) expect(publico).not.toHaveProperty(interno);
        expect(Object.values(publico)).not.toContain(auto.whatsapp);
      }),
    );
  });

  it("toma solo el primer nombre del cliente", () => {
    const auto: Auto = {
      id: "00000000-0000-4000-8000-000000000000",
      tokenPublico: "t",
      nombreCliente: "Luisa Fernanda Gómez",
      whatsapp: "3001234567",
      placa: "MZX915",
      modelo: "Renault Logan 2019",
      estado: "proceso",
      creadoEn: new Date("2026-11-02T15:00:00Z"),
      actualizadoEn: new Date("2026-11-02T15:42:00Z"),
    };
    expect(aAutoPublico(auto).primerNombre).toBe("Luisa");
  });
});
