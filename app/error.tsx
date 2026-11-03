"use client";

import { useEffect } from "react";
import { NOMBRE_TALLER } from "@/lib/dominio/taller";

// Error general al cargar una página (por ejemplo, si no responde la base de datos).
// En producción Next.js no envía al navegador el detalle de errores del servidor.
export default function ErrorGeneral({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="dr-app dr-shell">
      <title>{`Algo salió mal · ${NOMBRE_TALLER}`}</title>
      <main className="dr-body">
        <div className="dr-saludo__taller">{NOMBRE_TALLER}</div>
        <section className="dr-panel dr-panel--mensaje" role="alert">
          <h1>Algo salió mal</h1>
          <div>No pudimos cargar esta página. Revisa tu conexión e intenta de nuevo.</div>
        </section>
        <button type="button" className="dr-btn dr-btn--primary" onClick={() => retry()}>
          Reintentar
        </button>
      </main>
    </div>
  );
}
