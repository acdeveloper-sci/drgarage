import { PanelRecogida } from "@/components/ui/PanelRecogida";
import { NOMBRE_TALLER } from "@/lib/dominio/taller";

// Mismo mensaje para cualquier token que no existe: no revela si alguna vez existió.
export default function EnlaceInactivo() {
  return (
    <main className="dr-body">
      <div className="dr-saludo__taller">{NOMBRE_TALLER}</div>
      <section className="dr-panel dr-panel--inactivo">
        <h1>Este enlace ya no está activo</h1>
        <div>Los enlaces de seguimiento funcionan hasta 30 días después de entregar el vehículo.</div>
        <div className="dr-muted">Si necesitas algo, comunícate con el taller.</div>
      </section>
      <PanelRecogida />
    </main>
  );
}
