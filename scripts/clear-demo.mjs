// Deletes the demo data created by seed-demo.mjs: only cars whose token_publico starts with "demo-",
// their quotes first, then their events (the foreign keys forbid deleting a car that has either), then
// the cars, by id.
// Usage: npm run seed:clear
import { createClient } from "@supabase/supabase-js";

export const DEMO_PREFIX = "demo-";

// Own service-role client: lib/supabase/cliente.ts is server-only and cannot be imported from a plain script.
export function createDemoClient() {
  process.loadEnvFile(new URL("../.env.local", import.meta.url));
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function clearDemo(supabase) {
  const { data: cars, error } = await supabase.from("autos").select("id").like("token_publico", `${DEMO_PREFIX}%`);
  if (error) throw new Error(`Could not list demo cars: ${error.message}`);
  const ids = cars.map((car) => car.id);
  if (ids.length === 0) return { quotes: 0, events: 0, cars: 0 };

  const quotes = await supabase.from("cotizaciones").delete({ count: "exact" }).in("auto_id", ids);
  if (quotes.error) throw new Error(`Could not delete demo quotes: ${quotes.error.message}`);
  const events = await supabase.from("eventos").delete({ count: "exact" }).in("auto_id", ids);
  if (events.error) throw new Error(`Could not delete demo events: ${events.error.message}`);
  const deleted = await supabase.from("autos").delete({ count: "exact" }).in("id", ids);
  if (deleted.error) throw new Error(`Could not delete demo cars: ${deleted.error.message}`);
  return { quotes: quotes.count ?? 0, events: events.count ?? 0, cars: deleted.count ?? 0 };
}

if (import.meta.main) {
  const { quotes, events, cars } = await clearDemo(createDemoClient());
  console.log(`Deleted ${cars} demo cars, ${events} demo events and ${quotes} demo quotes.`);
}
