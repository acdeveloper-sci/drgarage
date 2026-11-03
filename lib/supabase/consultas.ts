import "server-only";
import { esEstado, type Estado } from "@/lib/dominio/estados";
import { generarTokenPublico } from "@/lib/dominio/token";
import { aAutoPublico } from "@/lib/dominio/transformaciones";
import type { Auto, AutoPublico, Evento, TipoEvento } from "@/lib/dominio/tipos";
import { clienteSupabase } from "./cliente";

// ---- Mapeo de filas (snake_case, fechas como texto) a tipos de dominio. Único lugar donde se hace. ----

interface FilaAuto {
  id: string;
  token_publico: string;
  nombre_cliente: string;
  whatsapp: string;
  placa: string;
  modelo: string;
  problema: string | null;
  estado: string;
  creado_en: string;
  actualizado_en: string;
}

function aAuto(fila: FilaAuto): Auto {
  if (!esEstado(fila.estado)) throw new Error(`Estado desconocido en la base de datos: ${fila.estado}`);
  return {
    id: fila.id,
    tokenPublico: fila.token_publico,
    nombreCliente: fila.nombre_cliente,
    whatsapp: fila.whatsapp,
    placa: fila.placa,
    modelo: fila.modelo,
    problema: fila.problema ?? undefined,
    estado: fila.estado,
    creadoEn: new Date(fila.creado_en),
    actualizadoEn: new Date(fila.actualizado_en),
  };
}

interface FilaEvento {
  id: string;
  auto_id: string;
  tipo: string;
  descripcion: string;
  creado_en: string;
}

function aEvento(fila: FilaEvento): Evento {
  if (fila.tipo !== "cambio_estado" && fila.tipo !== "aviso_enviado") {
    throw new Error(`Tipo de evento desconocido en la base de datos: ${fila.tipo}`);
  }
  return {
    id: fila.id,
    autoId: fila.auto_id,
    tipo: fila.tipo,
    descripcion: fila.descripcion,
    creadoEn: new Date(fila.creado_en),
  };
}

// Un id que no es uuid haría fallar a Postgres; se trata como "no existe".
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fallo(operacion: string, error: { message: string }): Error {
  return new Error(`No se pudo ${operacion}: ${error.message}`);
}

// ---- Autos ----

export interface DatosNuevoAuto {
  nombreCliente: string;
  whatsapp: string; // ya validado: 10 dígitos
  placa: string; // ya normalizada
  modelo: string;
  problema?: string;
}

export async function insertarAuto(datos: DatosNuevoAuto): Promise<Auto> {
  const { data, error } = await clienteSupabase()
    .from("autos")
    .insert({
      token_publico: generarTokenPublico(),
      nombre_cliente: datos.nombreCliente,
      whatsapp: datos.whatsapp,
      placa: datos.placa,
      modelo: datos.modelo,
      problema: datos.problema ?? null,
      estado: "recibido",
    })
    .select()
    .single();
  if (error) throw fallo("registrar el auto", error);
  return aAuto(data);
}

// Más reciente primero.
export async function listarAutos(): Promise<Auto[]> {
  const { data, error } = await clienteSupabase().from("autos").select().order("actualizado_en", { ascending: false });
  if (error) throw fallo("cargar los autos", error);
  return data.map(aAuto);
}

// Solo para la vista del taller: incluye el WhatsApp. Devuelve null si no existe.
export async function obtenerAutoPorId(id: string): Promise<Auto | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await clienteSupabase().from("autos").select().eq("id", id).maybeSingle();
  if (error) throw fallo("consultar el auto", error);
  return data ? aAuto(data) : null;
}

// Vista pública: devuelve solo los campos permitidos (sin WhatsApp), o null si el token no existe.
export async function obtenerAutoPorToken(token: string): Promise<AutoPublico | null> {
  const { data, error } = await clienteSupabase().from("autos").select().eq("token_publico", token).maybeSingle();
  if (error) throw fallo("consultar el auto", error);
  return data ? aAutoPublico(aAuto(data)) : null;
}

// Cambia el estado y marca actualizado_en con la hora actual en UTC. Devuelve null si el auto no existe.
export async function actualizarEstado(id: string, estado: Estado): Promise<Auto | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await clienteSupabase()
    .from("autos")
    .update({ estado, actualizado_en: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw fallo("cambiar el estado", error);
  return data ? aAuto(data) : null;
}

// ---- Eventos ----

export async function insertarEvento(autoId: string, tipo: TipoEvento, descripcion: string): Promise<Evento> {
  const { data, error } = await clienteSupabase()
    .from("eventos")
    .insert({ auto_id: autoId, tipo, descripcion })
    .select()
    .single();
  if (error) throw fallo("registrar el evento", error);
  return aEvento(data);
}

// Actividad del auto, más reciente primero.
export async function listarEventos(autoId: string): Promise<Evento[]> {
  if (!UUID.test(autoId)) return [];
  const { data, error } = await clienteSupabase()
    .from("eventos")
    .select()
    .eq("auto_id", autoId)
    .order("creado_en", { ascending: false });
  if (error) throw fallo("cargar la actividad del auto", error);
  return data.map(aEvento);
}
