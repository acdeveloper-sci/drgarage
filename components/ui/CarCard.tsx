import Link from "next/link";
import { avisoCotizacionLista } from "@/lib/dominio/cotizaciones";
import { ETIQUETAS_ESTADO } from "@/lib/dominio/estados";
import { formatearFecha } from "@/lib/dominio/fechas";
import type { Auto } from "@/lib/dominio/tipos";

// Tarjeta tocable que abre la ficha del auto. Debajo, el chip de su última cotización no anulada
// (siempre, sin el límite de 3 horas del prototipo: design.md, sección 14).
export function CarCard({ auto }: { auto: Auto }) {
  const cotizacion = auto.ultimaCotizacion;
  const aviso = avisoCotizacionLista(cotizacion?.estado);
  return (
    <Link href={`/autos/${auto.id}`} className="dr-card">
      <div className="dr-row">
        <span className="dr-plate">{auto.placa}</span>
        <span className={`dr-chip dr-chip--${auto.estado}`}>{ETIQUETAS_ESTADO[auto.estado]}</span>
      </div>
      <div className="dr-lead">{auto.modelo}</div>
      <div className="dr-row dr-muted">
        <span>{auto.nombreCliente}</span>
        <time dateTime={auto.actualizadoEn.toISOString()}>{formatearFecha(auto.actualizadoEn)}</time>
      </div>
      {cotizacion && aviso && <span className={`dr-chip dr-chip--${cotizacion.estado}`}>{aviso}</span>}
    </Link>
  );
}
