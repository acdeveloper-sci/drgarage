"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { crearCotizacion, type EstadoFormularioCotizacion } from "../../../acciones";
import { ERROR_CONEXION } from "../../../textos";

const INICIAL: EstadoFormularioCotizacion = { tipo: "inicial", valores: { descripcion: "", costo: "" } };

// Formulario de la captura 08. Si la petición no llega al servidor (sin red), se muestra el error de
// conexión con Reintentar y se conserva lo escrito; nada se da por guardado hasta que el servidor confirma.
export function FormularioCotizacion({ autoId }: { autoId: string }) {
  const [estado, accion, enviando] = useActionState(async (previo: EstadoFormularioCotizacion, datos: FormData) => {
    try {
      return await crearCotizacion(autoId, previo, datos);
    } catch {
      const valores = { descripcion: String(datos.get("descripcion") ?? ""), costo: String(datos.get("costo") ?? "") };
      return { tipo: "error", valores, error: ERROR_CONEXION, conexion: true } as const;
    }
  }, INICIAL);
  const router = useRouter();
  const v = estado.valores;

  useEffect(() => {
    if (estado.tipo === "guardado") router.push(`/autos/${autoId}?aviso=cotizacion`);
  }, [estado, router, autoId]);

  const errores = estado.tipo === "error" && !estado.conexion ? [estado.errores.descripcion, estado.errores.costo].filter(Boolean) : [];

  return (
    <form action={accion} className="dr-body" noValidate>
      <label className="dr-field">
        Descripción de la reparación
        <textarea
          className="dr-textarea"
          name="descripcion"
          placeholder="Ej. Cambio de discos delanteros"
          defaultValue={v.descripcion}
          aria-invalid={estado.tipo === "error" && !estado.conexion && Boolean(estado.errores.descripcion)}
        />
      </label>
      <label className="dr-field">
        Costo (COP)
        <input
          className="dr-input dr-input--monto"
          name="costo"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="350000"
          defaultValue={v.costo}
          aria-invalid={estado.tipo === "error" && !estado.conexion && Boolean(estado.errores.costo)}
        />
      </label>
      {errores.length > 0 && (
        <div className="dr-error" role="alert">
          {errores.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      )}
      {estado.tipo === "error" && estado.conexion ? (
        <div className="dr-notice dr-notice--error" role="alert">
          {estado.error}
          <button className="dr-btn dr-btn--reject" type="submit" disabled={enviando} aria-busy={enviando}>
            Reintentar
          </button>
        </div>
      ) : (
        <button className="dr-btn dr-btn--primary" type="submit" disabled={enviando || estado.tipo === "guardado"} aria-busy={enviando}>
          Guardar cotización
        </button>
      )}
      <p className="dr-muted dr-nota-pie">Al guardar, el estado pasa a “Cotización enviada” y podrás enviarla por WhatsApp.</p>
    </form>
  );
}
