import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { ERROR_WHATSAPP, normalizarPlaca, validarWhatsApp } from "./normalizacion";

describe("normalizarPlaca (Property 1)", () => {
  it.each(["KMT482", "kmt482", "KMT 482", "KMT-482", " kmt - 482 ", "kmt\t482"])("normaliza %j a KMT482", (placa) => {
    expect(normalizarPlaca(placa)).toBe("KMT482");
  });

  it.each([
    ["ASCII", fc.string()],
    ["Unicode", fc.string({ unit: "grapheme" })],
  ])("deja la placa sin espacios, guiones ni minúsculas (%s)", (_, texto) => {
    fc.assert(
      fc.property(texto, (placa) => {
        const resultado = normalizarPlaca(placa);
        expect(resultado).not.toMatch(/[\s-]/);
        expect(resultado).toBe(resultado.toUpperCase());
      }),
    );
  });

  it("es idempotente: normalizar dos veces da lo mismo que una vez", () => {
    fc.assert(fc.property(fc.string({ unit: "grapheme" }), (placa) => normalizarPlaca(normalizarPlaca(placa)) === normalizarPlaca(placa)));
  });
});

describe("validarWhatsApp (Property 2)", () => {
  it.each([
    ["3001234567", "3001234567"],
    ["300 123 4567", "3001234567"],
    ["300-123-4567", "3001234567"],
    [" 300 123-4567 ", "3001234567"],
  ])("acepta %j como %s", (entrada, whatsapp) => {
    expect(validarWhatsApp(entrada)).toEqual({ ok: true, whatsapp });
  });

  it.each([
    ["9 dígitos", "300123456"],
    ["11 dígitos", "30012345678"],
    ["texto no numérico", "abc"],
    ["vacío", ""],
    ["una letra entre dígitos", "300 123 456a"],
    ["con prefijo de país", "+57 300 123 4567"],
    ["dígitos de ancho completo", "３００１２３４５６７"],
  ])("rechaza %s con el mensaje que explica cómo corregirlo", (_, entrada) => {
    expect(validarWhatsApp(entrada)).toEqual({ ok: false, error: ERROR_WHATSAPP });
  });

  it("el mensaje de error es el del design", () => {
    expect(ERROR_WHATSAPP).toBe("Revisa el WhatsApp: debe tener 10 dígitos, por ejemplo 300 123 4567.");
  });

  it("solo acepta lo que, sin espacios ni guiones, queda en exactamente 10 dígitos", () => {
    fc.assert(
      fc.property(fc.string(), (entrada) => {
        const limpio = entrada.replace(/[\s-]/g, "");
        const resultado = validarWhatsApp(entrada);
        expect(resultado.ok).toBe(/^[0-9]{10}$/.test(limpio));
        if (resultado.ok) expect(resultado.whatsapp).toBe(limpio);
      }),
    );
  });

  it("acepta cualquier número de 10 dígitos escrito con espacios o guiones", () => {
    const digito = fc.constantFrom(..."0123456789");
    fc.assert(
      fc.property(fc.array(digito, { minLength: 10, maxLength: 10 }), fc.constantFrom(" ", "-", ""), (ds, sep) => {
        const entrada = [ds.slice(0, 3), ds.slice(3, 6), ds.slice(6)].map((g) => g.join("")).join(sep);
        expect(validarWhatsApp(entrada)).toEqual({ ok: true, whatsapp: ds.join("") });
      }),
    );
  });

  it("rechaza cualquier cantidad de dígitos distinta de 10", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[0-9]{0,20}$/).filter((s) => s.length !== 10), (entrada) => {
        expect(validarWhatsApp(entrada).ok).toBe(false);
      }),
    );
  });
});
