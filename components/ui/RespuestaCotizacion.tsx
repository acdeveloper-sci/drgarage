import { ETIQUETAS_COTIZACION, formatearCostoCop } from "@/lib/dominio/cotizaciones";
import { formatearFecha } from "@/lib/dominio/fechas";
import type { CotizacionPublica } from "@/lib/dominio/tipos";

// "Tu respuesta" de la vista del cliente (captura 11): una cotización ya aprobada o rechazada.
// Sin "use client": la página la renderiza en el servidor, así las fechas no difieren al hidratar.
export function RespuestaCotizacion({ cotizacion }: { cotizacion: CotizacionPublica }) {
  if (cotizacion.estado !== "aprobada" && cotizacion.estado !== "rechazada") return null;
  return (
    <>
      <h2 className="dr-eyebrow">Tu respuesta</h2>
      <div className="dr-card">
        <div className="dr-row">
          <span className="dr-monto">{formatearCostoCop(cotizacion.costoCop)}</span>
          <span className={`dr-chip dr-chip--${cotizacion.estado}`}>{ETIQUETAS_COTIZACION[cotizacion.estado]}</span>
        </div>
        <div>{cotizacion.descripcion}</div>
        {cotizacion.decididaEn && (
          <div className="dr-caption dr-caption--fuerte">
            {ETIQUETAS_COTIZACION[cotizacion.estado]} el{" "}
            <time dateTime={cotizacion.decididaEn.toISOString()}>{formatearFecha(cotizacion.decididaEn)}</time>
          </div>
        )}
        {cotizacion.nota && <div className="dr-quote-note">Tu nota: “{cotizacion.nota}”</div>}
      </div>
    </>
  );
}
