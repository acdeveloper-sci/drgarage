import type { EstadoCotizacion } from "./cotizaciones";
import type { Estado } from "./estados";

export type { EstadoCotizacion } from "./cotizaciones";
export type { Estado } from "./estados";

export interface Cotizacion {
  id: string;
  autoId: string;
  descripcion: string;
  costoCop: number;
  estado: EstadoCotizacion;
  enviadaEn: Date;
  decididaEn?: Date;
  nota?: string; // Solo si fue rechazada
}

// Lo único que la página del cliente recibe de una cotización (sin auto_id). Incluye la nota:
// la escribió el propio cliente y la captura 11 se la muestra ("Tu nota").
export type CotizacionPublica = Pick<Cotizacion, "id" | "descripcion" | "costoCop" | "estado" | "enviadaEn" | "decididaEn" | "nota">;

export interface Auto {
  id: string;
  tokenPublico: string;
  nombreCliente: string;
  whatsapp: string; // Solo para uso interno del taller
  placa: string;
  modelo: string;
  problema?: string;
  estado: Estado;
  creadoEn: Date;
  actualizadoEn: Date;
  ultimaCotizacion?: Cotizacion; // La más reciente que no esté anulada
}

// Lo único que ve el cliente en /auto/[token]. Nunca incluye el WhatsApp.
export interface AutoPublico {
  primerNombre: string;
  placa: string;
  modelo: string;
  estado: Estado;
  actualizadoEn: Date;
  cotizacion?: CotizacionPublica; // La más reciente que no esté anulada
}

export type TipoEvento = "ingreso" | "cambio_estado" | "aviso_enviado" | "cotizacion_creada" | "cotizacion_decidida";

export interface Evento {
  id: string;
  autoId: string;
  tipo: TipoEvento;
  descripcion: string;
  creadoEn: Date;
}
