import { ESTADOS, ETIQUETAS_ESTADO, type Estado } from "@/lib/dominio/estados";
import { IconoCheck } from "./Iconos";

// Avance en 4 pasos: los anteriores completados y el actual activo. En Listo, todos completados.
export function Stepper({ estado }: { estado: Estado }) {
  const actual = ESTADOS.indexOf(estado);
  const todoListo = estado === "listo";
  return (
    <ol className="dr-steps" aria-label="Avance de tu vehículo">
      {ESTADOS.map((paso, i) => {
        const hecho = todoListo || i < actual;
        const enCurso = !todoListo && i === actual;
        return (
          <li key={paso} className={`dr-step${hecho ? " dr-step--done" : enCurso ? " dr-step--current" : ""}`} aria-current={enCurso ? "step" : undefined}>
            <span className="dr-step__dot">{hecho && <IconoCheck />}</span>
            <span>
              {ETIQUETAS_ESTADO[paso]}
              {hecho && <span className="dr-vh"> (completado)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
