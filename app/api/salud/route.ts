import { clienteSupabase } from "@/lib/supabase/cliente";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { error } = await clienteSupabase()
      .from("autos")
      .select("id", { count: "exact", head: true })
      .limit(1);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
