import "server-only";
import { esEstadoCotizacion } from "@/lib/dominio/cotizaciones";
import { esEstado, type Estado } from "@/lib/dominio/estados";
import { generarTokenPublico } from "@/lib/dominio/token";
import { aAutoPublico } from "@/lib/dominio/transformaciones";
import type { Auto, AutoPublico, Cotizacion, Evento, TipoEvento } from "@/lib/dominio/tipos";
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

const TIPOS_EVENTO: readonly TipoEvento[] = ["ingreso", "cambio_estado", "aviso_enviado", "cotizacion_creada", "cotizacion_decidida"];

function esTipoEvento(valor: string): valor is TipoEvento {
  return (TIPOS_EVENTO as readonly string[]).includes(valor);
}

function aEvento(fila: FilaEvento): Evento {
  if (!esTipoEvento(fila.tipo)) throw new Error(`Tipo de evento desconocido en la base de datos: ${fila.tipo}`);
  return {
    id: fila.id,
    autoId: fila.auto_id,
    tipo: fila.tipo,
    descripcion: fila.descripcion,
    creadoEn: new Date(fila.creado_en),
  };
}

interface FilaCotizacion {
  id: string;
  auto_id: string;
  descripcion: string;
  costo_cop: number;
  estado: string;
  enviada_en: string;
  decidida_en: string | null;
  nota: string | null;
}

function aCotizacion(fila: FilaCotizacion): Cotizacion {
  if (!esEstadoCotizacion(fila.estado)) throw new Error(`Estado de cotización desconocido en la base de datos: ${fila.estado}`);
  return {
    id: fila.id,
    autoId: fila.auto_id,
    descripcion: fila.descripcion,
    costoCop: fila.costo_cop,
    estado: fila.estado,
    enviadaEn: new Date(fila.enviada_en),
    decididaEn: fila.decidida_en ? new Date(fila.decidida_en) : undefined,
    nota: fila.nota ?? undefined,
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

// La cotización más reciente que no esté anulada de cada auto, con una sola consulta para todos.
async function ultimasCotizaciones(autoIds: string[]): Promise<Map<string, Cotizacion>> {
  const ultimas = new Map<string, Cotizacion>();
  if (autoIds.length === 0) return ultimas;
  const { data, error } = await clienteSupabase()
    .from("cotizaciones")
    .select()
    .in("auto_id", autoIds)
    .neq("estado", "anulada")
    .order("enviada_en", { ascending: false });
  if (error) throw fallo("cargar las cotizaciones", error);
  for (const fila of data) if (!ultimas.has(fila.auto_id)) ultimas.set(fila.auto_id, aCotizacion(fila));
  return ultimas;
}

async function conUltimaCotizacion(auto: Auto): Promise<Auto> {
  const ultimaCotizacion = (await ultimasCotizaciones([auto.id])).get(auto.id);
  return ultimaCotizacion ? { ...auto, ultimaCotizacion } : auto;
}

// Más reciente primero, cada uno con su ultimaCotizacion.
export async function listarAutos(): Promise<Auto[]> {
  const { data, error } = await clienteSupabase().from("autos").select().order("actualizado_en", { ascending: false });
  if (error) throw fallo("cargar los autos", error);
  const autos = data.map(aAuto);
  const ultimas = await ultimasCotizaciones(autos.map((auto) => auto.id));
  return autos.map((auto) => {
    const ultimaCotizacion = ultimas.get(auto.id);
    return ultimaCotizacion ? { ...auto, ultimaCotizacion } : auto;
  });
}

// Solo para la vista del taller: incluye el WhatsApp y ultimaCotizacion. Devuelve null si no existe.
export async function obtenerAutoPorId(id: string): Promise<Auto | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await clienteSupabase().from("autos").select().eq("id", id).maybeSingle();
  if (error) throw fallo("consultar el auto", error);
  return data ? conUltimaCotizacion(aAuto(data)) : null;
}

// Vista pública: devuelve solo los campos permitidos (sin WhatsApp; la cotización sin nota ni auto_id),
// o null si el token no existe.
export async function obtenerAutoPorToken(token: string): Promise<AutoPublico | null> {
  const { data, error } = await clienteSupabase().from("autos").select().eq("token_publico", token).maybeSingle();
  if (error) throw fallo("consultar el auto", error);
  return data ? aAutoPublico(await conUltimaCotizacion(aAuto(data))) : null;
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

// ---- Cotizaciones ----

// Otra cotización pendiente se creó al mismo tiempo para el mismo auto (índice único). Reintentar es seguro.
export class ErrorCotizacionSimultanea extends Error {
  constructor() {
    super("Se creó otra cotización al mismo tiempo para este auto. Intenta de nuevo.");
    this.name = "ErrorCotizacionSimultanea";
  }
}

const VIOLACION_UNICA = "23505";

// Anula la pendiente del auto (si existe) y crea la nueva pendiente. No es una transacción:
// si el insert falla, la anterior ya quedó anulada, y el reintento crea la nueva sin duplicar.
export async function crearCotizacion(autoId: string, descripcion: string, costoCop: number): Promise<Cotizacion> {
  const db = clienteSupabase();
  const anulacion = await db.from("cotizaciones").update({ estado: "anulada" }).eq("auto_id", autoId).eq("estado", "pendiente");
  if (anulacion.error) throw fallo("anular la cotización anterior", anulacion.error);
  const { data, error } = await db
    .from("cotizaciones")
    .insert({ auto_id: autoId, descripcion, costo_cop: costoCop, estado: "pendiente" })
    .select()
    .single();
  if (error?.code === VIOLACION_UNICA) throw new ErrorCotizacionSimultanea();
  if (error) throw fallo("guardar la cotización", error);
  return aCotizacion(data);
}

// Historial del auto, la más reciente primero (incluye anuladas).
export async function listarCotizaciones(autoId: string): Promise<Cotizacion[]> {
  if (!UUID.test(autoId)) return [];
  const { data, error } = await clienteSupabase()
    .from("cotizaciones")
    .select()
    .eq("auto_id", autoId)
    .order("enviada_en", { ascending: false });
  if (error) throw fallo("cargar las cotizaciones", error);
  return data.map(aCotizacion);
}

// Devuelve null si no existe o si el id no es uuid.
export async function obtenerCotizacionPorId(id: string): Promise<Cotizacion | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await clienteSupabase().from("cotizaciones").select().eq("id", id).maybeSingle();
  if (error) throw fallo("consultar la cotización", error);
  return data ? aCotizacion(data) : null;
}

// Para la acción pública: resuelve el id del auto a partir del token y devuelve solo el id (o null).
export async function idAutoPorToken(token: string): Promise<string | null> {
  const { data, error } = await clienteSupabase().from("autos").select("id").eq("token_publico", token).maybeSingle();
  if (error) throw fallo("consultar el auto", error);
  return data ? data.id : null;
}

export type ResultadoDecision = { aplicada: boolean; cotizacion: Cotizacion | null };

// Decisión única: un solo update condicionado a que la cotización sea de ese auto y siga pendiente.
// Si no cambia ninguna fila, devuelve la cotización tal como está, pero solo si es de ese auto:
// con un token que no corresponde devuelve null, para no mostrar la cotización de otro auto.
export async function decidirCotizacion(
  cotizacionId: string,
  autoId: string,
  estadoNuevo: "aprobada" | "rechazada",
  nota?: string,
): Promise<ResultadoDecision> {
  if (!UUID.test(cotizacionId) || !UUID.test(autoId)) return { aplicada: false, cotizacion: null };
  const db = clienteSupabase();
  const { data, error } = await db
    .from("cotizaciones")
    .update({
      estado: estadoNuevo,
      decidida_en: new Date().toISOString(),
      nota: estadoNuevo === "rechazada" ? (nota ?? null) : null,
    })
    .eq("id", cotizacionId)
    .eq("auto_id", autoId)
    .eq("estado", "pendiente")
    .select()
    .maybeSingle();
  if (error) throw fallo("guardar la decisión", error);
  if (data) return { aplicada: true, cotizacion: aCotizacion(data) };

  const existente = await db.from("cotizaciones").select().eq("id", cotizacionId).eq("auto_id", autoId).maybeSingle();
  if (existente.error) throw fallo("consultar la cotización", existente.error);
  return { aplicada: false, cotizacion: existente.data ? aCotizacion(existente.data) : null };
}
