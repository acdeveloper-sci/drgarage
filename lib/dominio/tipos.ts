import type { Estado } from "./estados";

export type { Estado } from "./estados";

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
}

// Lo único que ve el cliente en /auto/[token]. Nunca incluye el WhatsApp.
export interface AutoPublico {
  primerNombre: string;
  placa: string;
  modelo: string;
  estado: Estado;
  actualizadoEn: Date;
}

export type TipoEvento = "cambio_estado" | "aviso_enviado";

export interface Evento {
  id: string;
  autoId: string;
  tipo: TipoEvento;
  descripcion: string;
  creadoEn: Date;
}
