"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { RespuestaCotizacion } from "@/components/ui/RespuestaCotizacion";
import { ATAJOS_NOTA, MAXIMO_NOTA, formatearCostoCop, type DecisionCotizacion as Decision } from "@/lib/dominio/cotizaciones";
import type { CotizacionPublica } from "@/lib/dominio/tipos";
import { ERROR_CONEXION } from "../../(taller)/textos";
import { decidirCotizacion } from "./acciones";

const AVISO_CAMBIO = "La cotización cambió mientras respondías. Revisa la información actualizada.";

interface Props {
  token: string;
  cotizacion: CotizacionPublica | null; // la que trae la página (se actualiza con el sondeo)
  respuesta: ReactNode; // "Tu respuesta" renderizada en el servidor a partir de `cotizacion`
}

// Cotización pendiente con Aprobar / Rechazar (capturas 09 y 10). Nada se muestra como decidido hasta
// que el servidor lo confirma. El sondeo (router.refresh) conserva este estado: la nota escrita no se pierde.
export function DecisionCotizacion({ token, cotizacion, respuesta }: Props) {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();
  const [decidida, setDecidida] = useState<CotizacionPublica | null>(null); // confirmada por el servidor, antes del refresco
  const [rechazandoId, setRechazandoId] = useState<string | null>(null);
  const [nota, setNota] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [fallida, setFallida] = useState<{ decision: Decision; nota?: string } | null>(null); // para Reintentar
  const campoNota = useRef<HTMLTextAreaElement>(null);

  const rechazando = cotizacion !== null && rechazandoId === cotizacion.id;
  useEffect(() => {
    if (rechazando) campoNota.current?.focus();
  }, [rechazando]);

  function decidir(decision: Decision, notaEnviada?: string) {
    if (!cotizacion || enviando) return;
    const id = cotizacion.id;
    setAviso(null);
    iniciar(async () => {
      let resultado: Awaited<ReturnType<typeof decidirCotizacion>> | null = null;
      try {
        resultado = await decidirCotizacion(token, id, decision, notaEnviada);
      } catch {
        // sin red: la petición no llegó o no volvió
      }
      if (!resultado || resultado.tipo === "error") {
        setFallida({ decision, nota: notaEnviada });
        return;
      }
      setFallida(null);
      if (resultado.tipo === "decidida") {
        setDecidida(resultado.cotizacion);
        setRechazandoId(null);
        setNota("");
      } else if (resultado.tipo === "sin_cambio") {
        const misma = resultado.cotizacion?.id === id;
        if (misma && resultado.cotizacion) setDecidida(resultado.cotizacion);
        setRechazandoId(null);
        setAviso(AVISO_CAMBIO);
      }
      router.refresh(); // también para "enlace_inactivo": la página muestra la de enlace inactivo
    });
  }

  // Lo que confirmó el servidor manda mientras la página aún no se ha refrescado con la misma cotización.
  const vigente = decidida && decidida.id === cotizacion?.id && cotizacion.estado === "pendiente" ? decidida : cotizacion;

  return (
    <>
      {aviso && (
        <div key={aviso} className="dr-notice dr-flash" role="status">
          {aviso}
        </div>
      )}
      {fallida && (
        <div className="dr-notice dr-notice--error" role="alert">
          {ERROR_CONEXION}
          <button type="button" className="dr-btn dr-btn--reject" disabled={enviando} aria-busy={enviando} onClick={() => decidir(fallida.decision, fallida.nota)}>
            Reintentar
          </button>
        </div>
      )}
      {vigente?.estado === "pendiente" && (
        <section className="dr-quote" aria-busy={enviando}>
          <h2 className="dr-eyebrow">Reparación adicional · requiere tu aprobación</h2>
          <div className="dr-quote__descripcion">{vigente.descripcion}</div>
          <div className="dr-price">{formatearCostoCop(vigente.costoCop)}</div>
          {!rechazando ? (
            <div className="dr-status-grid">
              <button type="button" className="dr-btn dr-btn--approve" disabled={enviando} onClick={() => decidir("aprobar")}>
                Aprobar
              </button>
              <button type="button" className="dr-btn dr-btn--reject" disabled={enviando} onClick={() => setRechazandoId(vigente.id)}>
                Rechazar
              </button>
            </div>
          ) : (
            <>
              <label className="dr-field">
                ¿Por qué la rechazas? (opcional)
                <textarea
                  ref={campoNota}
                  className="dr-textarea"
                  maxLength={MAXIMO_NOTA}
                  placeholder="Escribe una breve nota"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                />
              </label>
              <div className="dr-notechips">
                {ATAJOS_NOTA.map((atajo) => (
                  <button key={atajo} type="button" className="dr-notechip" onClick={() => setNota(atajo)}>
                    {atajo}
                  </button>
                ))}
              </div>
              <button type="button" className="dr-btn dr-btn--reject" disabled={enviando} aria-busy={enviando} onClick={() => decidir("rechazar", nota)}>
                Enviar rechazo
              </button>
              <button type="button" className="dr-btn dr-btn--link" disabled={enviando} onClick={() => setRechazandoId(null)}>
                Cancelar
              </button>
            </>
          )}
        </section>
      )}
      {vigente && vigente.estado !== "pendiente" && (vigente === cotizacion ? respuesta : <RespuestaCotizacion cotizacion={vigente} />)}
    </>
  );
}
