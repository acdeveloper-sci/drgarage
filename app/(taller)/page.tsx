import Link from "next/link";
import { connection } from "next/server";
import { AppHeaderLista } from "@/components/ui/AppHeader";
import { CarCard } from "@/components/ui/CarCard";
import { IconoMas } from "@/components/ui/Iconos";
import { listarAutos } from "@/lib/supabase/consultas";

export default async function ListaAutos() {
  await connection(); // siempre datos actuales, nunca los del build
  const autos = await listarAutos();

  return (
    <>
      <AppHeaderLista titulo="Autos en taller" conteo={autos.length === 1 ? "1 auto" : `${autos.length} autos`} />
      <main className="dr-body">
        <Link href="/autos/nuevo" className="dr-btn dr-btn--accent">
          <IconoMas />
          Ingresar auto
        </Link>
        {autos.length > 0 ? (
          autos.map((auto) => <CarCard key={auto.id} auto={auto} />)
        ) : (
          <div className="dr-panel dr-panel--empty">
            <div className="dr-panel__title">No hay autos en el taller</div>
            <div className="dr-muted">Cuando llegue uno, toca “Ingresar auto”.</div>
          </div>
        )}
        <Link href="/conoce" className="dr-btn dr-btn--link">
          ¿Qué es drGarage?
        </Link>
      </main>
    </>
  );
}
