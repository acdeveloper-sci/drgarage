"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { registrarAuto } from "../../acciones";
import { leerValores, type EstadoIngreso } from "../../ingreso";
import { ERROR_CONEXION } from "../../textos";

const INICIAL: EstadoIngreso = { tipo: "inicial", valores: { nombre: "", whatsapp: "", placa: "", modelo: "", problema: "" } };

// Si la petición no llega al servidor (sin red), se muestra el error de conexión y se conserva lo escrito.
async function registrar(previo: EstadoIngreso, datos: FormData): Promise<EstadoIngreso> {
  try {
    return await registrarAuto(previo, datos);
  } catch {
    return { tipo: "error", valores: leerValores(datos), error: ERROR_CONEXION, conexion: true };
  }
}

export function FormularioIngreso() {
  const [estado, accion, enviando] = useActionState(registrar, INICIAL);
  const router = useRouter();
  const v = estado.valores;

  useEffect(() => {
    if (estado.tipo === "guardado") router.push(`/autos/${estado.id}?aviso=registrado`);
  }, [estado, router]);

  return (
    <form action={accion} className="dr-body" noValidate>
      <label className="dr-field">
        Nombre del cliente
        <input className="dr-input" name="nombre" type="text" autoComplete="off" placeholder="Ej. María López" defaultValue={v.nombre} />
      </label>
      <label className="dr-field">
        WhatsApp del cliente
        <input className="dr-input" name="whatsapp" type="tel" inputMode="tel" placeholder="300 123 4567" defaultValue={v.whatsapp} />
      </label>
      <div className="dr-status-grid">
        <label className="dr-field">
          Placa
          <input className="dr-input dr-input--plate" name="placa" type="text" autoCapitalize="characters" autoComplete="off" placeholder="ABC123" defaultValue={v.placa} />
        </label>
        <label className="dr-field">
          Modelo
          <input className="dr-input" name="modelo" type="text" placeholder="Mazda 3 2018" defaultValue={v.modelo} />
        </label>
      </div>
      <label className="dr-field">
        Problema reportado
        <textarea className="dr-textarea" name="problema" placeholder="Ej. Ruido al frenar" defaultValue={v.problema} />
      </label>
      {estado.tipo === "error" && !estado.conexion && (
        <div className="dr-error" role="alert">
          {estado.error}
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
          Registrar ingreso
        </button>
      )}
    </form>
  );
}
