import { notFound } from "next/navigation";
import { PanelRecogida } from "@/components/ui/PanelRecogida";
import { RespuestaCotizacion } from "@/components/ui/RespuestaCotizacion";
import { Stepper } from "@/components/ui/Stepper";
import { ETIQUETAS_ESTADO, descripcionEstado } from "@/lib/dominio/estados";
import { formatearFecha } from "@/lib/dominio/fechas";
import { NOMBRE_TALLER } from "@/lib/dominio/taller";
import { obtenerAutoPorToken } from "@/lib/supabase/consultas";
import { DecisionCotizacion } from "./DecisionCotizacion";
import { Sondeo } from "./Sondeo";

// Vista pública: solo recibe un AutoPublico (sin WhatsApp ni datos internos del taller).
export default async function SeguimientoAuto({ params }: PageProps<"/auto/[token]">) {
  const { token } = await params;
  const auto = await obtenerAutoPorToken(token);
  if (!auto) notFound();

  return (
    <main className="dr-body">
      <header className="dr-saludo">
        <div className="dr-saludo__taller">{NOMBRE_TALLER}</div>
        <h1>Hola, {auto.primerNombre}</h1>
      </header>
      <section className="dr-panel dr-panel--estado">
        <div className="dr-auto-id">
          <span className="dr-plate dr-plate--xl">{auto.placa}</span>
          <span>{auto.modelo}</span>
        </div>
        <div className="dr-stack">
          <h2 className="dr-eyebrow">Estado actual</h2>
          <div className="type-status">{ETIQUETAS_ESTADO[auto.estado]}</div>
          <div>{descripcionEstado(auto.estado, auto.cotizacion?.estado)}</div>
          <div className="dr-caption">
            Actualizado: <time dateTime={auto.actualizadoEn.toISOString()}>{formatearFecha(auto.actualizadoEn)}</time>
          </div>
        </div>
        <Stepper estado={auto.estado} />
      </section>
      {auto.estado === "listo" && <PanelRecogida />}
      <DecisionCotizacion
        token={token}
        cotizacion={auto.cotizacion ?? null}
        respuesta={auto.cotizacion ? <RespuestaCotizacion cotizacion={auto.cotizacion} /> : null}
      />
      <p className="dr-hint">Esta página se actualiza sola. No necesitas registrarte ni instalar nada.</p>
      <Sondeo />
    </main>
  );
}
