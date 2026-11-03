import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { IconoDocumento, IconoMensaje, IconoTelefono } from "@/components/ui/Iconos";

export const metadata: Metadata = {
  title: "drGarage · Para talleres pequeños",
  description: "Seguimiento por enlace de WhatsApp y aprobación de reparaciones con fecha y hora, desde el celular.",
};

const BENEFICIOS: { icono: ReactNode; titulo: string; texto: string }[] = [
  { icono: <IconoTelefono />, titulo: "Menos llamadas", texto: "Tus clientes ven en qué va su carro desde un enlace, sin llamarte." },
  { icono: <IconoDocumento />, titulo: "Reparaciones aprobadas por escrito", texto: "Cada aprobación o rechazo queda guardado con fecha y hora." },
  { icono: <IconoMensaje />, titulo: "Sin apps ni cuentas para el cliente", texto: "Abre el enlace que le mandas por WhatsApp. No instala ni registra nada." },
];

const PASOS: { titulo: string; texto: string }[] = [
  { titulo: "Registra el auto", texto: "Nombre, WhatsApp, placa y modelo, desde tu celular." },
  { titulo: "Avisa por WhatsApp", texto: "Con un toque le mandas al cliente el enlace de su carro." },
  { titulo: "El cliente sigue y aprueba", texto: "Ve el avance y aprueba o rechaza las reparaciones adicionales." },
];

// Portada pública para dueños de talleres pequeños (docs/producto/icp-y-personas.md). Sin datos ni formularios.
export default function Conoce() {
  return (
    <div className="dr-app dr-shell">
      <header className="dr-header dr-header--stack">
        <div className="dr-sub">drGarage · Para talleres pequeños</div>
        <h1>Que tus clientes dejen de llamar para preguntar por su carro.</h1>
        <p className="dr-header__lema">Seguimiento por enlace de WhatsApp y aprobación de reparaciones con fecha y hora, desde el celular.</p>
      </header>
      <main className="dr-body">
        <ul className="dr-lista">
          {BENEFICIOS.map((b) => (
            <li key={b.titulo} className="dr-panel dr-item">
              <span className="dr-item__icono">{b.icono}</span>
              <div className="dr-stack">
                <h2 className="dr-lead">{b.titulo}</h2>
                <p className="dr-muted">{b.texto}</p>
              </div>
            </li>
          ))}
        </ul>

        <h2 className="dr-eyebrow">Así funciona</h2>
        <ol className="dr-lista">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="dr-item">
              <span className="dr-item__num" aria-hidden="true">
                {i + 1}
              </span>
              <div className="dr-stack">
                <h3 className="dr-lead">{p.titulo}</h3>
                <p className="dr-muted">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>

        <figure className="dr-panel">
          <div className="dr-eyebrow">Ejemplo ilustrativo</div>
          <blockquote className="dr-cita">“Yo sé arreglar carros; lo que no doy abasto es contestar el teléfono.”</blockquote>
          <figcaption className="dr-muted">— Ramiro, Taller Don Ramiro</figcaption>
        </figure>

        <Link href="/" className="dr-btn dr-btn--primary">
          Ver el taller de ejemplo
        </Link>
      </main>
    </div>
  );
}
