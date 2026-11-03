import type { Metadata } from "next";
import Link from "next/link";
import { NOMBRE_TALLER } from "@/lib/dominio/taller";

export const metadata: Metadata = {
  title: `Página no encontrada · ${NOMBRE_TALLER}`,
  robots: { index: false, follow: false },
};

// 404 general: rutas que no existen y autos del taller que no se encuentran.
// Los enlaces del cliente (/auto/[token]) tienen su propia página.
export default function PaginaNoEncontrada() {
  return (
    <div className="dr-app dr-shell">
      <main className="dr-body">
        <div className="dr-saludo__taller">{NOMBRE_TALLER}</div>
        <section className="dr-panel dr-panel--mensaje">
          <h1>No encontramos esta página</h1>
          <div>Revisa que el enlace esté completo y bien escrito.</div>
          <div className="dr-muted">Si necesitas algo, comunícate con el taller.</div>
        </section>
        <Link href="/" className="dr-btn dr-btn--outline">
          Ir al inicio
        </Link>
      </main>
    </div>
  );
}
