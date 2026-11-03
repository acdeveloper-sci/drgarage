import { DIRECCION_TALLER, HORARIO_TALLER } from "@/lib/dominio/taller";

export function PanelRecogida() {
  return (
    <div className="dr-panel dr-panel--recogida">
      <div className="dr-eyebrow">Dónde recogerlo</div>
      <div className="dr-label-fuerte">{DIRECCION_TALLER}</div>
      <div className="dr-muted">{HORARIO_TALLER}</div>
    </div>
  );
}
