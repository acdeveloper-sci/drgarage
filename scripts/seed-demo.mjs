// Fills Supabase with 4 demo cars (one per state) and 3 quotes (pending, approved, rejected with a note),
// based on design/pantallas/03-taller-lista.png and the prototype's sample data.
// Idempotent: it first deletes the previous demo data, then inserts it again with fresh timestamps.
// Demo cars are marked only by token_publico starting with "demo-". WhatsApp numbers are fictitious.
// Usage: npm run seed:demo
import { clearDemo, createDemoClient } from "./clear-demo.mjs";

const MINUTE = 60_000;

// Event types and descriptions match what the app writes (lib/dominio/tipos.ts, app/(taller)/acciones.ts).
const ingreso = (minutesAgo) => ({ tipo: "ingreso", descripcion: "Ingreso registrado", minutesAgo });
const estado = (label, minutesAgo) => ({ tipo: "cambio_estado", descripcion: `Estado: ${label}`, minutesAgo });
const aviso = (minutesAgo) => ({ tipo: "aviso_enviado", descripcion: "Aviso enviado por WhatsApp", minutesAgo });
// Same texts as lib/dominio/cotizaciones.ts (formatearCostoCop, textoEventoDecision).
const cop = (n) => "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const cotizacionEnviada = (costo, minutesAgo) => ({ tipo: "cotizacion_creada", descripcion: `Cotización enviada: ${cop(costo)}`, minutesAgo });
const aprobada = (minutesAgo) => ({ tipo: "cotizacion_decidida", descripcion: "Cliente aprobó la cotización", minutesAgo });
const rechazada = (nota, minutesAgo) => ({ tipo: "cotizacion_decidida", descripcion: `Cliente rechazó la cotización: “${nota}”`, minutesAgo });

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
    quote: { descripcion: "Recarga de gas refrigerante y cambio de filtro de cabina.", costo_cop: 210000, estado: "aprobada", sentAgo: 140, decidedAgo: 110 },
    events: [ingreso(200), cotizacionEnviada(210000, 140), aprobada(110), estado("En proceso", 55)],
  },
  {
    token_publico: "demo-cotizacion",
    nombre_cliente: "Carlos Restrepo",
    whatsapp: "3000000003",
    placa: "KMT482",
    modelo: "Chevrolet Spark GT 2016",
    problema: "Ruido metálico al frenar",
    estado: "cotizacion",
    quote: {
      descripcion: "Cambio de discos y pastillas delanteras. Los discos están por debajo del espesor mínimo.",
      costo_cop: 380000,
      estado: "pendiente",
      sentAgo: 25,
    },
    // Creating a quote logs only "Cotización enviada: $…" (no separate state event), like the app.
    events: [ingreso(150), estado("En proceso", 120), cotizacionEnviada(380000, 25)],
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
    quote: { descripcion: "Alineación y balanceo.", costo_cop: 90000, estado: "rechazada", sentAgo: 90, decidedAgo: 80, nota: "Prefiero revisarlo después" },
    events: [ingreso(180), estado("En proceso", 140), aviso(135), cotizacionEnviada(90000, 90), rechazada("Prefiero revisarlo después", 80), estado("Listo", 15)],
  },
];

const supabase = createDemoClient();
const removed = await clearDemo(supabase);
console.log(`Removed previous demo data: ${removed.cars} cars, ${removed.events} events, ${removed.quotes} quotes.`);

const now = Date.now();
const at = (minutesAgo) => new Date(now - minutesAgo * MINUTE).toISOString();

for (const { events, quote, ...car } of DEMO_CARS) {
  const { data, error } = await supabase
    .from("autos")
    .insert({ ...car, creado_en: at(events[0].minutesAgo), actualizado_en: at(events.at(-1).minutesAgo) })
    .select("id")
    .single();
  if (error) throw new Error(`Could not insert ${car.placa}: ${error.message}`);

  const rows = events.map(({ tipo, descripcion, minutesAgo }) => ({ auto_id: data.id, tipo, descripcion, creado_en: at(minutesAgo) }));
  const inserted = await supabase.from("eventos").insert(rows);
  if (inserted.error) throw new Error(`Could not insert events for ${car.placa}: ${inserted.error.message}`);

  if (quote) {
    const { sentAgo, decidedAgo, nota, ...fields } = quote;
    const row = { ...fields, auto_id: data.id, enviada_en: at(sentAgo), decidida_en: decidedAgo ? at(decidedAgo) : null, nota: nota ?? null };
    const quoteInserted = await supabase.from("cotizaciones").insert(row);
    if (quoteInserted.error) throw new Error(`Could not insert the quote for ${car.placa}: ${quoteInserted.error.message}`);
  }
}

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
console.log(`Inserted ${DEMO_CARS.length} demo cars and ${DEMO_CARS.filter((car) => car.quote).length} quotes. Public links:`);
for (const car of DEMO_CARS) console.log(`  ${car.placa}  ${siteUrl}/auto/${car.token_publico}`);
