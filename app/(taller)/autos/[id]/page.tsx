import { notFound } from "next/navigation";
import { AppHeaderVolver } from "@/components/ui/AppHeader";
import { formatearFecha } from "@/lib/dominio/fechas";
import { armarMensajeWhatsApp } from "@/lib/dominio/mensajes";
import { listarEventos, obtenerAutoPorId } from "@/lib/supabase/consultas";
import { AccionesAuto } from "./AccionesAuto";

const AVISO_REGISTRADO = "Auto registrado. Envía el enlace de seguimiento al cliente con el botón verde.";

export default async function FichaAuto({ params, searchParams }: PageProps<"/autos/[id]">) {
  const { id } = await params;
  const { aviso } = await searchParams;
  const auto = await obtenerAutoPorId(id);
  if (!auto) notFound();
  const eventos = await listarEventos(id);

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
          urlWhatsApp={armarMensajeWhatsApp(auto, urlSitio)}
          avisoInicial={aviso === "registrado" ? AVISO_REGISTRADO : null}
        />
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
