"use server";

import { revalidatePath } from "next/cache";
import { textoEventoDecision, validarNota, type DecisionCotizacion } from "@/lib/dominio/cotizaciones";
import { aCotizacionPublica } from "@/lib/dominio/transformaciones";
import type { CotizacionPublica } from "@/lib/dominio/tipos";
import { decidirCotizacion as guardarDecision, idAutoPorToken, insertarEvento, obtenerAutoPorToken } from "@/lib/supabase/consultas";
import { ERROR_CONEXION } from "../../(taller)/textos";

export type ResultadoDecisionCliente =
  | { tipo: "decidida"; cotizacion: CotizacionPublica }
  // No se modificó nada: la cotización ya no estaba pendiente o no es de este auto.
  // Se devuelve la cotización actual de este auto (nunca la de otro).
  | { tipo: "sin_cambio"; cotizacion: CotizacionPublica | null }
  | { tipo: "enlace_inactivo" }
  | { tipo: "error"; error: string };

// Acción pública: solo la protege el token no adivinable. No confía en nada del navegador salvo
// el token, el id de la cotización y la decisión validada. La decisión es única (update condicionado).
export async function decidirCotizacion(
  token: string,
  cotizacionId: string,
  decision: DecisionCotizacion,
  nota?: string,
): Promise<ResultadoDecisionCliente> {
  if (decision !== "aprobar" && decision !== "rechazar") return { tipo: "error", error: ERROR_CONEXION };
  if (typeof token !== "string" || typeof cotizacionId !== "string") return { tipo: "error", error: ERROR_CONEXION };

  let notaValida: string | undefined;
  if (decision === "rechazar") {
    const validacion = validarNota(typeof nota === "string" ? nota : "");
    if (!validacion.ok) return { tipo: "error", error: ERROR_CONEXION }; // el campo ya limita a 140: solo llega si se salta la página
    notaValida = validacion.nota;
  }

  try {
    const autoId = await idAutoPorToken(token);
    if (!autoId) return { tipo: "enlace_inactivo" };

    const estadoNuevo = decision === "aprobar" ? "aprobada" : "rechazada";
    const resultado = await guardarDecision(cotizacionId, autoId, estadoNuevo, notaValida);

    if (resultado.aplicada && resultado.cotizacion) {
      try {
        await insertarEvento(autoId, "cotizacion_decidida", textoEventoDecision(estadoNuevo, notaValida));
      } catch (error) {
        console.error(error); // la decisión ya quedó guardada; solo falta el registro en la actividad
      }
      revalidatePath("/");
      revalidatePath(`/autos/${autoId}`);
      revalidatePath(`/auto/${token}`);
      return { tipo: "decidida", cotizacion: aCotizacionPublica(resultado.cotizacion) };
    }

    if (resultado.cotizacion) return { tipo: "sin_cambio", cotizacion: aCotizacionPublica(resultado.cotizacion) };
    const auto = await obtenerAutoPorToken(token); // la cotización no es de este auto: se devuelve la propia
    return auto ? { tipo: "sin_cambio", cotizacion: auto.cotizacion ?? null } : { tipo: "enlace_inactivo" };
  } catch (error) {
    console.error(error);
    return { tipo: "error", error: ERROR_CONEXION };
  }
}
