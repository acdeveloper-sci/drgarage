"use server";

import { revalidatePath } from "next/cache";
import { formatearCostoCop, validarCotizacion } from "@/lib/dominio/cotizaciones";
import { ETIQUETAS_ESTADO, esEstado } from "@/lib/dominio/estados";
import { ERROR_WHATSAPP, normalizarPlaca, validarWhatsApp } from "@/lib/dominio/normalizacion";
import {
  actualizarEstado,
  crearCotizacion as guardarCotizacion,
  insertarAuto,
  insertarEvento,
  obtenerAutoPorId,
} from "@/lib/supabase/consultas";
import { leerValores, type EstadoIngreso } from "./ingreso";
import { ERROR_CONEXION, ERROR_OBLIGATORIOS } from "./textos";

// Devuelve los valores escritos en cada error para que el formulario los conserve.
export async function registrarAuto(_previo: EstadoIngreso, datos: FormData): Promise<EstadoIngreso> {
  const valores = leerValores(datos);
  const nombre = valores.nombre.trim();
  const placa = normalizarPlaca(valores.placa);
  const modelo = valores.modelo.trim();
  if (!nombre || !placa || !modelo) return { tipo: "error", valores, error: ERROR_OBLIGATORIOS, conexion: false };

  const whatsapp = validarWhatsApp(valores.whatsapp);
  if (!whatsapp.ok) return { tipo: "error", valores, error: ERROR_WHATSAPP, conexion: false };

  let id: string;
  try {
    const auto = await insertarAuto({ nombreCliente: nombre, whatsapp: whatsapp.whatsapp, placa, modelo, problema: valores.problema.trim() || undefined });
    id = auto.id;
  } catch (error) {
    console.error(error);
    return { tipo: "error", valores, error: ERROR_CONEXION, conexion: true };
  }

  // Si solo falla el evento, el auto ya existe: se abre la ficha igual para que un reintento no lo duplique.
  try {
    await insertarEvento(id, "ingreso", "Ingreso registrado");
  } catch (error) {
    console.error(error);
  }

  revalidatePath("/");
  return { tipo: "guardado", valores, id };
}

export type ResultadoCambio = { ok: true } | { ok: false; error: string };

// Siempre guarda el estado y crea su evento: así un reintento nunca deja un cambio sin evento.
// Que el estado sea distinto al actual lo decide la interfaz (el botón del estado actual no hace nada).
export async function cambiarEstado(id: string, estado: unknown): Promise<ResultadoCambio> {
  if (!esEstado(estado)) return { ok: false, error: ERROR_CONEXION };
  try {
    const auto = await actualizarEstado(id, estado);
    if (!auto) return { ok: false, error: ERROR_CONEXION };
    await insertarEvento(id, "cambio_estado", `Estado: ${ETIQUETAS_ESTADO[estado]}`);
    revalidatePath(`/autos/${id}`);
    revalidatePath("/");
    revalidatePath(`/auto/${auto.tokenPublico}`);
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, error: ERROR_CONEXION };
  }
}

// Se llama al tocar el botón de WhatsApp. Si falla, el mensaje igual se abre; solo falta el registro.
export async function registrarAviso(id: string): Promise<void> {
  try {
    await insertarEvento(id, "aviso_enviado", "Aviso enviado por WhatsApp");
    revalidatePath(`/autos/${id}`);
  } catch (error) {
    console.error(error);
  }
}

// ---- Cotización adicional ----

export interface ValoresCotizacion {
  descripcion: string;
  costo: string;
}

// Solo tipos: un archivo "use server" no puede exportar valores que no sean funciones asíncronas.
export type EstadoFormularioCotizacion =
  | { tipo: "inicial"; valores: ValoresCotizacion }
  | { tipo: "error"; valores: ValoresCotizacion; errores: { descripcion?: string; costo?: string }; conexion: false }
  | { tipo: "error"; valores: ValoresCotizacion; error: string; conexion: true }
  | { tipo: "guardado"; valores: ValoresCotizacion };

// Devuelve lo escrito en cada error para que el formulario lo conserve. Anula la pendiente anterior,
// crea la nueva, registra el evento y pasa el auto a "Cotización enviada".
export async function crearCotizacion(
  autoId: string,
  _previo: EstadoFormularioCotizacion,
  datos: FormData,
): Promise<EstadoFormularioCotizacion> {
  const valores: ValoresCotizacion = { descripcion: String(datos.get("descripcion") ?? ""), costo: String(datos.get("costo") ?? "") };
  const validacion = validarCotizacion(valores);
  if (!validacion.ok) return { tipo: "error", valores, errores: validacion.errores, conexion: false };

  const conexion = { tipo: "error", valores, error: ERROR_CONEXION, conexion: true } as const;
  try {
    const auto = await obtenerAutoPorId(autoId);
    if (!auto) return conexion;
    await guardarCotizacion(auto.id, validacion.descripcion, validacion.costoCop);

    // Si solo falla el evento, la cotización ya existe: se sigue para no dejar el auto sin su estado.
    try {
      await insertarEvento(auto.id, "cotizacion_creada", `Cotización enviada: ${formatearCostoCop(validacion.costoCop)}`);
    } catch (error) {
      console.error(error);
    }

    // Si esto falla, el reintento anula la cotización recién creada y crea otra: nunca quedan dos pendientes.
    if (!(await actualizarEstado(auto.id, "cotizacion"))) return conexion;

    revalidatePath("/");
    revalidatePath(`/autos/${auto.id}`);
    revalidatePath(`/auto/${auto.tokenPublico}`);
    return { tipo: "guardado", valores };
  } catch (error) {
    console.error(error); // incluye ErrorCotizacionSimultanea: reintentar es seguro
    return conexion;
  }
}
