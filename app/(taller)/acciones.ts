"use server";

import { revalidatePath } from "next/cache";
import { ETIQUETAS_ESTADO, esEstado } from "@/lib/dominio/estados";
import { ERROR_WHATSAPP, normalizarPlaca, validarWhatsApp } from "@/lib/dominio/normalizacion";
import { actualizarEstado, insertarAuto, insertarEvento } from "@/lib/supabase/consultas";
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
