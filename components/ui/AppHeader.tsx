import Link from "next/link";
import type { ReactNode } from "react";
import { IconoVolver } from "./Iconos";

// Encabezado de la lista: nombre del taller, título y conteo.
export function AppHeaderLista({ titulo, conteo }: { titulo: string; conteo: string }) {
  return (
    <header className="dr-header dr-header--stack">
      <div className="dr-sub">Taller Don Ramiro</div>
      <div className="dr-row">
        <h1>{titulo}</h1>
        <span className="dr-header__count">{conteo}</span>
      </div>
    </header>
  );
}

// Encabezado de subpantalla: botón de volver más el título (o la placa) y un subtítulo opcional.
export function AppHeaderVolver({ href, etiquetaVolver, children, sub }: { href: string; etiquetaVolver: string; children: ReactNode; sub?: string }) {
  return (
    <header className="dr-header">
      <Link href={href} className="dr-iconbtn" aria-label={etiquetaVolver}>
        <IconoVolver />
      </Link>
      <div className="dr-stack">
        {children}
        {sub && <div className="dr-sub">{sub}</div>}
      </div>
    </header>
  );
}
