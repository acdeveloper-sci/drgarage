import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  ATAJOS_NOTA,
  ERROR_COSTO,
  ERROR_DESCRIPCION,
  ESTADOS_COTIZACION,
  avisoCotizacionLista,
  esEstadoCotizacion,
  esFinal,
  formatearCostoCop,
  parsearCosto,
  resolverDecision,
  textoEventoDecision,
  transicionValida,
  validarCotizacion,
  validarNota,
  type DecisionCotizacion,
} from "./cotizaciones";

const estado = fc.constantFrom(...ESTADOS_COTIZACION);
const decision = fc.constantFrom<DecisionCotizacion>("aprobar", "rechazar");

// ---- 8.1 Estados y decisión única ----

describe("estados de la cotización", () => {
  it("reconoce solo los cuatro estados", () => {
    for (const e of ESTADOS_COTIZACION) expect(esEstadoCotizacion(e)).toBe(true);
    for (const otro of ["", "Pendiente", "aprobado", "cancelada", 1, null, undefined]) expect(esEstadoCotizacion(otro)).toBe(false);
  });

  it("solo se sale de pendiente, y nunca hacia pendiente", () => {
    fc.assert(
      fc.property(estado, estado, (actual, nuevo) => {
        expect(transicionValida(actual, nuevo)).toBe(actual === "pendiente" && nuevo !== "pendiente");
      }),
    );
  });

  it("aprobada, rechazada y anulada son finales", () => {
    expect(esFinal("pendiente")).toBe(false);
    for (const e of ["aprobada", "rechazada", "anulada"] as const) expect(esFinal(e)).toBe(true);
  });
});

describe("resolverDecision (decisión única)", () => {
  it("una pendiente se aplica una sola vez", () => {
    expect(resolverDecision("pendiente", "aprobar")).toEqual({ aplicar: true, resultado: "aprobada" });
    expect(resolverDecision("pendiente", "rechazar")).toEqual({ aplicar: true, resultado: "rechazada" });
  });

  it("una anulada no cambia con ninguna decisión", () => {
    fc.assert(fc.property(decision, (d) => {
      expect(resolverDecision("anulada", d)).toEqual({ aplicar: false, resultado: "anulada" });
    }));
  });

  it("propiedad: decidir dos veces equivale a decidir una (la segunda no aplica y devuelve el estado existente)", () => {
    fc.assert(
      fc.property(estado, decision, decision, (inicial, primera, segunda) => {
        const r1 = resolverDecision(inicial, primera);
        const r2 = resolverDecision(r1.resultado, segunda);
        expect(r2).toEqual({ aplicar: false, resultado: r1.resultado });
        expect(r1.aplicar).toBe(inicial === "pendiente");
        expect(transicionValida(inicial, r1.resultado)).toBe(r1.aplicar);
      }),
    );
  });
});

// ---- 8.2 Costo, validación y nota ----

describe("parsearCosto y formatearCostoCop", () => {
  it.each([
    ["$380.000", 380000],
    ["380000", 380000],
    ["1.250.000", 1250000],
    [" $ 380.000 ", 380000],
    ["1", 1],
  ])("acepta %j", (texto, valor) => {
    expect(parsearCosto(texto)).toBe(valor);
  });

  it.each(["0", "000", "12.5", "380,5", "", "   ", "abc", "-5", "38.0000", "1.2345", "9".repeat(20)])("rechaza %j", (texto) => {
    expect(parsearCosto(texto)).toBeNull();
  });

  it("formatea con puntos de miles y signo", () => {
    expect(formatearCostoCop(380000)).toBe("$380.000");
    expect(formatearCostoCop(1250000)).toBe("$1.250.000");
    expect(formatearCostoCop(900)).toBe("$900");
  });

  it("propiedad: parsearCosto(formatearCostoCop(n)) === n", () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }), (n) => {
      expect(parsearCosto(formatearCostoCop(n))).toBe(n);
    }));
  });

  it("propiedad: el número sin puntos también se acepta", () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 2_000_000_000 }), (n) => {
      expect(parsearCosto(String(n))).toBe(n);
    }));
  });
});

describe("validarCotizacion", () => {
  it("válida: recorta la descripción y convierte el costo", () => {
    expect(validarCotizacion({ descripcion: "  Cambio de discos  ", costo: "$380.000" })).toEqual({
      ok: true,
      descripcion: "Cambio de discos",
      costoCop: 380000,
    });
  });

  it("errores por campo, con los textos del prototipo", () => {
    expect(validarCotizacion({ descripcion: "   ", costo: "380000" })).toEqual({ ok: false, errores: { descripcion: ERROR_DESCRIPCION } });
    expect(validarCotizacion({ descripcion: "Discos", costo: "380,5" })).toEqual({ ok: false, errores: { costo: ERROR_COSTO } });
    expect(validarCotizacion({ descripcion: "", costo: "" })).toEqual({ ok: false, errores: { descripcion: ERROR_DESCRIPCION, costo: ERROR_COSTO } });
    expect(ERROR_DESCRIPCION).toBe("Escribe la descripción de la reparación.");
    expect(ERROR_COSTO).toBe("Escribe el costo en pesos, solo números.");
  });
});

describe("validarNota", () => {
  it("es opcional: vacía o solo espacios queda sin nota", () => {
    expect(validarNota("")).toEqual({ ok: true });
    expect(validarNota("   ")).toEqual({ ok: true });
  });

  it("recorta y acepta hasta 140 caracteres (contados como Postgres, con tildes y emoji)", () => {
    expect(validarNota("  Muy costoso por ahora ")).toEqual({ ok: true, nota: "Muy costoso por ahora" });
    expect(validarNota("é".repeat(140))).toEqual({ ok: true, nota: "é".repeat(140) });
    expect(validarNota("🚗".repeat(140)).ok).toBe(true);
    expect(validarNota("é".repeat(141))).toEqual({ ok: false });
  });
});

describe("textos de la cotización", () => {
  it("ATAJOS_NOTA: las tres opciones del prototipo, con tildes", () => {
    expect(ATAJOS_NOTA).toEqual(["Muy costoso por ahora", "Prefiero revisarlo después", "Solo lo reportado"]);
  });

  it("evento de la decisión, como en el prototipo", () => {
    expect(textoEventoDecision("aprobada")).toBe("Cliente aprobó la cotización");
    expect(textoEventoDecision("aprobada", "ignorada")).toBe("Cliente aprobó la cotización");
    expect(textoEventoDecision("rechazada", "Muy costoso por ahora")).toBe("Cliente rechazó la cotización: “Muy costoso por ahora”");
    expect(textoEventoDecision("rechazada")).toBe("Cliente rechazó la cotización");
  });

  it("chip de la lista según la última cotización no anulada", () => {
    expect(avisoCotizacionLista("pendiente")).toBe("Esperando aprobación");
    expect(avisoCotizacionLista("aprobada")).toBe("Cotización aprobada");
    expect(avisoCotizacionLista("rechazada")).toBe("Cotización rechazada");
    expect(avisoCotizacionLista("anulada")).toBeNull();
    expect(avisoCotizacionLista(undefined)).toBeNull();
  });
});
