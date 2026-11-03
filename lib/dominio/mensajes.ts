import { ETIQUETAS_ESTADO } from "./estados";
import { NOMBRE_TALLER } from "./taller";
import type { Auto } from "./tipos";

export type DatosMensaje = Pick<Auto, "nombreCliente" | "whatsapp" | "modelo" | "placa" | "estado" | "tokenPublico">;

export function primerNombre(nombreCliente: string): string {
  return nombreCliente.trim().split(/\s+/)[0];
}

// urlSitio es NEXT_PUBLIC_SITE_URL; se recibe como parámetro para que la función siga siendo pura.
export function enlaceDelAuto(urlSitio: string, tokenPublico: string): string {
  return `${urlSitio.replace(/\/+$/, "")}/auto/${tokenPublico}`;
}

// Textos del prototipo (design/prototipo/prototipo.html, waMessage).
function textoMensaje(auto: DatosMensaje, enlace: string): string {
  const saludo = `Hola ${primerNombre(auto.nombreCliente)}`;
  const vehiculo = `${auto.modelo} (${auto.placa})`;
  switch (auto.estado) {
    case "recibido":
      return `${saludo}, recibimos tu ${vehiculo} en ${NOMBRE_TALLER}. Sigue el avance aquí: ${enlace}`;
    case "listo":
      return `${saludo}, tu ${vehiculo} ya está listo para recoger. Detalles aquí: ${enlace}`;
    default:
      return `${saludo}, tu ${vehiculo} está ahora: ${ETIQUETAS_ESTADO[auto.estado]}. Sigue el avance aquí: ${enlace}`;
  }
}

// Devuelve la URL https://wa.me/57{whatsapp}?text=... con el mensaje codificado.
export function armarMensajeWhatsApp(auto: DatosMensaje, urlSitio: string): string {
  const texto = textoMensaje(auto, enlaceDelAuto(urlSitio, auto.tokenPublico));
  return `https://wa.me/57${auto.whatsapp}?text=${encodeURIComponent(texto)}`;
}
