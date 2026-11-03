// Fills Supabase with 4 demo cars (one per state), based on design/pantallas/03-taller-lista.png.
// Idempotent: it first deletes the previous demo data, then inserts it again with fresh timestamps.
// Demo cars are marked only by token_publico starting with "demo-". WhatsApp numbers are fictitious.
// Usage: npm run seed:demo
import { clearDemo, createDemoClient } from "./clear-demo.mjs";

const MINUTE = 60_000;

// Event types and descriptions match what the app writes (lib/dominio/tipos.ts, app/(taller)/acciones.ts).
const ingreso = (minutesAgo) => ({ tipo: "ingreso", descripcion: "Ingreso registrado", minutesAgo });
const estado = (label, minutesAgo) => ({ tipo: "cambio_estado", descripcion: `Estado: ${label}`, minutesAgo });
const aviso = (minutesAgo) => ({ tipo: "aviso_enviado", descripcion: "Aviso enviado por WhatsApp", minutesAgo });

const DEMO_CARS = [
  {
    token_publico: "demo-recibido",
    nombre_cliente: "Andrea Vélez",
    whatsapp: "3000000001",
    placa: "DPR563",
    modelo: "Kia Picanto 2020",
    problema: "Testigo de motor encendido",
    estado: "recibido",
    events: [ingreso(8)],
  },
  {
    token_publico: "demo-en-proceso",
    nombre_cliente: "Luisa Fernanda Gómez",
    whatsapp: "3000000002",
    placa: "MZX915",
    modelo: "Renault Logan 2019",
    problema: "El aire acondicionado no enfría",
    estado: "proceso",
    events: [ingreso(200), estado("En proceso", 55)],
  },
  {
    token_publico: "demo-cotizacion",
    nombre_cliente: "Carlos Restrepo",
    whatsapp: "3000000003",
    placa: "KMT482",
    modelo: "Chevrolet Spark GT 2016",
    problema: "Ruido metálico al frenar",
    estado: "cotizacion",
    events: [ingreso(150), estado("En proceso", 120), estado("Cotización enviada", 25)],
  },
  {
    token_publico: "demo-listo",
    nombre_cliente: "Jorge Ramírez",
    whatsapp: "3000000004",
    placa: "HSK207",
    modelo: "Mazda 3 2014",
    problema: "Cambio de aceite y filtros",
    estado: "listo",
    // The notice comes before the last state change, so actualizado_en still matches the last event.
    events: [ingreso(180), estado("En proceso", 140), aviso(135), estado("Cotización enviada", 90), estado("Listo", 15)],
  },
];

const supabase = createDemoClient();
const removed = await clearDemo(supabase);
console.log(`Removed previous demo data: ${removed.cars} cars, ${removed.events} events.`);

const now = Date.now();
const at = (minutesAgo) => new Date(now - minutesAgo * MINUTE).toISOString();

for (const { events, ...car } of DEMO_CARS) {
  const { data, error } = await supabase
    .from("autos")
    .insert({ ...car, creado_en: at(events[0].minutesAgo), actualizado_en: at(events.at(-1).minutesAgo) })
    .select("id")
    .single();
  if (error) throw new Error(`Could not insert ${car.placa}: ${error.message}`);

  const rows = events.map(({ tipo, descripcion, minutesAgo }) => ({ auto_id: data.id, tipo, descripcion, creado_en: at(minutesAgo) }));
  const inserted = await supabase.from("eventos").insert(rows);
  if (inserted.error) throw new Error(`Could not insert events for ${car.placa}: ${inserted.error.message}`);
}

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
console.log(`Inserted ${DEMO_CARS.length} demo cars. Public links:`);
for (const car of DEMO_CARS) console.log(`  ${car.placa}  ${siteUrl}/auto/${car.token_publico}`);
