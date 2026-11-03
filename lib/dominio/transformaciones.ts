import { primerNombre } from "./mensajes";
import type { Auto, AutoPublico } from "./tipos";

// Copia campo por campo (sin spread) para que el WhatsApp y los demás datos internos nunca lleguen al cliente.
export function aAutoPublico(auto: Auto): AutoPublico {
  return {
    primerNombre: primerNombre(auto.nombreCliente),
    placa: auto.placa,
    modelo: auto.modelo,
    estado: auto.estado,
    actualizadoEn: auto.actualizadoEn,
  };
}
