import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { ESTADOS } from "./estados";
import { armarMensajeWhatsApp, enlaceDelAuto, primerNombre, type DatosMensaje } from "./mensajes";

const SITIO = "https://drgarage.vercel.app";
const AUTO: DatosMensaje = {
  nombreCliente: "  Íñigo  Peña & Hijos ",
  whatsapp: "3001234567",
  modelo: "Renault Logan",
  placa: "ÑAB12&",
  estado: "proceso",
  tokenPublico: "abc_DEF-123",
};
const ENLACE = `${SITIO}/auto/abc_DEF-123`;

const texto = (url: string) => decodeURIComponent(url.split("?text=")[1]);

describe("primerNombre y enlaceDelAuto", () => {
  it("toma solo la primera palabra del nombre", () => {
    expect(primerNombre("  Carlos Andrés  Pérez")).toBe("Carlos");
    expect(primerNombre("Luisa")).toBe("Luisa");
  });

  it("arma /auto/{token} sin barras duplicadas", () => {
    expect(enlaceDelAuto("https://x.vercel.app/", "t")).toBe("https://x.vercel.app/auto/t");
    expect(enlaceDelAuto("http://localhost:3000", "t")).toBe("http://localhost:3000/auto/t");
  });
});

describe("armarMensajeWhatsApp (Property 4)", () => {
  it("abre wa.me con el prefijo 57 y el texto codificado (tildes, ñ, & y espacios)", () => {
    const url = armarMensajeWhatsApp(AUTO, SITIO);
    expect(url.startsWith("https://wa.me/573001234567?text=")).toBe(true);
    const codificado = url.split("?text=")[1];
    expect(codificado).not.toMatch(/[ &ñÑÍí]/);
    expect(codificado).toContain("%26"); // el & del nombre y de la placa no corta el parámetro
  });

  it("plantilla de Recibido", () => {
    expect(texto(armarMensajeWhatsApp({ ...AUTO, estado: "recibido" }, SITIO))).toBe(
      `Hola Íñigo, recibimos tu Renault Logan (ÑAB12&) en Taller Don Ramiro. Sigue el avance aquí: ${ENLACE}`,
    );
  });

  it("plantilla de Listo", () => {
    expect(texto(armarMensajeWhatsApp({ ...AUTO, estado: "listo" }, SITIO))).toBe(
      `Hola Íñigo, tu Renault Logan (ÑAB12&) ya está listo para recoger. Detalles aquí: ${ENLACE}`,
    );
  });

  it.each([
    ["proceso", "En proceso"],
    ["cotizacion", "Cotización enviada"],
  ] as const)("plantilla de otro estado (%s)", (estado, etiqueta) => {
    expect(texto(armarMensajeWhatsApp({ ...AUTO, estado }, SITIO))).toBe(
      `Hola Íñigo, tu Renault Logan (ÑAB12&) está ahora: ${etiqueta}. Sigue el avance aquí: ${ENLACE}`,
    );
  });

  it("para cualquier auto, el mensaje incluye primer nombre, modelo, placa y enlace", () => {
    const palabra = fc.string({ minLength: 1, unit: "grapheme" }).filter((s) => !/\s/.test(s));
    fc.assert(
      fc.property(
        palabra,
        fc.string({ unit: "grapheme" }),
        fc.string({ unit: "grapheme" }),
        fc.stringMatching(/^[A-Za-z0-9_-]{43}$/),
        fc.constantFrom(...ESTADOS),
        (nombre, modelo, placa, token, estado) => {
          const url = armarMensajeWhatsApp({ ...AUTO, nombreCliente: `${nombre} Apellido`, modelo, placa, estado, tokenPublico: token }, SITIO);
          const t = texto(url);
          expect(t.startsWith(`Hola ${nombre},`)).toBe(true);
          expect(t).not.toContain("Apellido");
          expect(t).toContain(`${modelo} (${placa})`);
          expect(t.endsWith(`${SITIO}/auto/${token}`)).toBe(true);
        },
      ),
    );
  });
});

describe("armarMensajeWhatsApp con cotización (8.3)", () => {
  const COTIZACION = { descripcion: "Cambio de discos & pastillas; ñ incluida.", costoCop: 380000, estado: "pendiente" as const };

  it("plantilla de cotización: texto exacto, costo $380.000, prefijo 57 y codificación", () => {
    const url = armarMensajeWhatsApp(AUTO, SITIO, COTIZACION);
    expect(url.startsWith("https://wa.me/573001234567?text=")).toBe(true);
    expect(url.split("?text=")[1]).not.toMatch(/[ &ñÑÍí$:]/);
    expect(texto(url)).toBe(
      `Hola Íñigo, en Taller Don Ramiro encontramos una reparación adicional para tu Renault Logan (ÑAB12&): Cambio de discos & pastillas; ñ incluida. Costo: $380.000. Apruébala o recházala aquí: ${ENLACE}`,
    );
  });

  it("con pendiente usa la plantilla de cotización en cualquier estado del auto", () => {
    for (const estado of ESTADOS) expect(texto(armarMensajeWhatsApp({ ...AUTO, estado }, SITIO, COTIZACION))).toContain("Apruébala o recházala aquí:");
  });

  it("sin cotización pendiente, el mensaje es el del feature 01", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ESTADOS), fc.constantFrom("aprobada", "rechazada", "anulada") as fc.Arbitrary<"aprobada" | "rechazada" | "anulada">, (estado, estadoCotizacion) => {
        const auto = { ...AUTO, estado };
        expect(armarMensajeWhatsApp(auto, SITIO, { ...COTIZACION, estado: estadoCotizacion })).toBe(armarMensajeWhatsApp(auto, SITIO));
      }),
    );
  });
});
