"use client";

import { useState, useTransition } from "react";
import { IconoMensaje } from "@/components/ui/Iconos";
import { ESTADOS, ETIQUETAS_ESTADO, type Estado } from "@/lib/dominio/estados";
import { cambiarEstado, registrarAviso } from "../../acciones";
import { ERROR_CONEXION } from "../../textos";

interface Props {
  id: string;
  estado: Estado;
  urlWhatsApp: string;
  avisoInicial: string | null;
}

// Aviso, botón de WhatsApp y botones de estado de la ficha. El estado marcado es siempre el que confirmó el servidor.
export function AccionesAuto({ id, estado, urlWhatsApp, avisoInicial }: Props) {
  const [aviso, setAviso] = useState(avisoInicial);
  const [fallido, setFallido] = useState<Estado | null>(null); // cambio que no se guardó, para reintentar
  const [guardando, iniciar] = useTransition();

  function cambiar(nuevo: Estado) {
    if (nuevo === estado || guardando) return; // tocar el estado actual no hace nada
    iniciar(async () => {
      let guardado = false;
      try {
        guardado = (await cambiarEstado(id, nuevo)).ok;
      } catch {
        // sin red: la petición no llegó o no volvió
      }
      if (guardado) {
        setFallido(null);
        setAviso(`Estado cambiado a “${ETIQUETAS_ESTADO[nuevo]}”. Avisa al cliente con el botón verde.`);
      } else {
        setAviso(null);
        setFallido(nuevo);
      }
    });
  }

  function avisar() {
    setAviso(null);
    iniciar(async () => {
      try {
        await registrarAviso(id);
      } catch {
        // el mensaje ya se abrió; solo falta el registro en la actividad
      }
    });
  }

  return (
    <>
      {fallido && (
        <div className="dr-notice dr-notice--error" role="alert">
          {ERROR_CONEXION}
          <button type="button" className="dr-btn dr-btn--reject" disabled={guardando} aria-busy={guardando} onClick={() => cambiar(fallido)}>
            Reintentar
          </button>
        </div>
      )}
      {aviso && (
        <div key={aviso} className="dr-notice dr-flash" role="status">
          {aviso}
        </div>
      )}
      <a className="dr-btn dr-btn--whatsapp" href={urlWhatsApp} target="_blank" rel="noopener" onClick={avisar}>
        <IconoMensaje />
        Avisar al cliente por WhatsApp
      </a>
      <h2 className="dr-eyebrow">Cambiar estado</h2>
      <div className="dr-status-grid" aria-busy={guardando}>
        {ESTADOS.map((e) => (
          <button key={e} type="button" className={`dr-status-btn dr-status-btn--${e}`} aria-pressed={e === estado} onClick={() => cambiar(e)}>
            {ETIQUETAS_ESTADO[e]}
          </button>
        ))}
      </div>
    </>
  );
}
