import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeaderVolver } from "@/components/ui/AppHeader";
import { IconoMas } from "@/components/ui/Iconos";
import { ETIQUETAS_COTIZACION, formatearCostoCop } from "@/lib/dominio/cotizaciones";
import { formatearFecha } from "@/lib/dominio/fechas";
import { armarMensajeWhatsApp } from "@/lib/dominio/mensajes";
import { listarCotizaciones, listarEventos, obtenerAutoPorId } from "@/lib/supabase/consultas";
import { AccionesAuto } from "./AccionesAuto";

const AVISOS: Record<string, string> = {
  registrado: "Auto registrado. Envía el enlace de seguimiento al cliente con el botón verde.",
  cotizacion: "Cotización guardada. Envíala al cliente con el botón verde.",
};

export default async function FichaAuto({ params, searchParams }: PageProps<"/autos/[id]">) {
  const { id } = await params;
  const { aviso } = await searchParams;
  const auto = await obtenerAutoPorId(id);
  if (!auto) notFound();
  const [cotizaciones, eventos] = await Promise.all([listarCotizaciones(id), listarEventos(id)]);

  const urlSitio = process.env.NEXT_PUBLIC_SITE_URL;
  if (!urlSitio) throw new Error("Falta NEXT_PUBLIC_SITE_URL para armar el enlace del cliente.");

  return (
    <>
      <AppHeaderVolver href="/" etiquetaVolver="Volver a la lista" sub={auto.modelo}>
        <span className="dr-plate">{auto.placa}</span>
      </AppHeaderVolver>
      <main className="dr-body">
        <div className="dr-stack">
          <div className="dr-lead">
            {auto.nombreCliente} · {auto.whatsapp}
          </div>
          <div className="dr-muted">Problema: {auto.problema ?? "—"}</div>
        </div>
        <AccionesAuto
          id={auto.id}
          estado={auto.estado}
          urlWhatsApp={armarMensajeWhatsApp(auto, urlSitio, auto.ultimaCotizacion)}
          cotizacionPendiente={auto.ultimaCotizacion?.estado === "pendiente"}
          avisoInicial={typeof aviso === "string" ? (AVISOS[aviso] ?? null) : null}
        />
        <Link href={`/autos/${auto.id}/cotizacion`} className="dr-btn dr-btn--outline">
          <IconoMas />
          Cotización adicional
        </Link>
        <h2 className="dr-eyebrow">Historial de cotizaciones</h2>
        {cotizaciones.length > 0 ? (
          cotizaciones.map((cotizacion) => (
            <div key={cotizacion.id} className="dr-card">
              <div className="dr-row">
                <span className="dr-monto">{formatearCostoCop(cotizacion.costoCop)}</span>
                <span className={`dr-chip dr-chip--${cotizacion.estado}`}>{ETIQUETAS_COTIZACION[cotizacion.estado]}</span>
              </div>
              <div>{cotizacion.descripcion}</div>
              <div className="dr-caption">
                Enviada: <time dateTime={cotizacion.enviadaEn.toISOString()}>{formatearFecha(cotizacion.enviadaEn)}</time>
              </div>
              {cotizacion.decididaEn && (
                <div className="dr-caption dr-caption--fuerte">
                  {ETIQUETAS_COTIZACION[cotizacion.estado]} el{" "}
                  <time dateTime={cotizacion.decididaEn.toISOString()}>{formatearFecha(cotizacion.decididaEn)}</time>
                </div>
              )}
              {cotizacion.nota && <div className="dr-quote-note">Nota del cliente: “{cotizacion.nota}”</div>}
            </div>
          ))
        ) : (
          <div className="dr-muted">Sin cotizaciones adicionales.</div>
        )}
        <h2 className="dr-eyebrow">Actividad</h2>
        <div>
          {eventos.map((evento) => (
            <div key={evento.id} className="dr-log">
              <span>{evento.descripcion}</span>
              <time dateTime={evento.creadoEn.toISOString()}>{formatearFecha(evento.creadoEn)}</time>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
