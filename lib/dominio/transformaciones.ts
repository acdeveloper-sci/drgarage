import { primerNombre } from "./mensajes";
import type { Auto, AutoPublico, Cotizacion, CotizacionPublica } from "./tipos";

// Copia campo por campo (sin spread) para que el auto_id nunca llegue al cliente.
export function aCotizacionPublica(cotizacion: Cotizacion): CotizacionPublica {
  const publica: CotizacionPublica = {
    id: cotizacion.id,
    descripcion: cotizacion.descripcion,
    costoCop: cotizacion.costoCop,
    estado: cotizacion.estado,
    enviadaEn: cotizacion.enviadaEn,
  };
  if (cotizacion.decididaEn) publica.decididaEn = cotizacion.decididaEn;
  if (cotizacion.nota) publica.nota = cotizacion.nota;
  return publica;
}

// Copia campo por campo (sin spread) para que el WhatsApp y los demás datos internos nunca lleguen al cliente.
export function aAutoPublico(auto: Auto): AutoPublico {
  const publico: AutoPublico = {
    primerNombre: primerNombre(auto.nombreCliente),
    placa: auto.placa,
    modelo: auto.modelo,
    estado: auto.estado,
    actualizadoEn: auto.actualizadoEn,
  };
  // ultimaCotizacion ya es la más reciente que no está anulada; se descarta si llegara una anulada.
  if (auto.ultimaCotizacion && auto.ultimaCotizacion.estado !== "anulada") publico.cotizacion = aCotizacionPublica(auto.ultimaCotizacion);
  return publico;
}
