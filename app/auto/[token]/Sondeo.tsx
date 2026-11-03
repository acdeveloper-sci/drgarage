"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Entre 15 y 20 segundos: el cliente ve un cambio de estado en menos de 30 (Requisito 5.1).
export const INTERVALO_SONDEO_MS = 17_500;

// Vuelve a pedir la página al servidor cada INTERVALO_SONDEO_MS. Se pausa con la pestaña oculta
// y refresca apenas vuelve a verse. Sin conexión no lo intenta: espera al siguiente intervalo.
export function Sondeo() {
  const router = useRouter();

  useEffect(() => {
    let temporizador: number | undefined;
    const refrescar = () => {
      if (navigator.onLine) router.refresh();
    };
    const detener = () => {
      window.clearInterval(temporizador);
      temporizador = undefined;
    };
    const iniciar = () => {
      detener();
      temporizador = window.setInterval(refrescar, INTERVALO_SONDEO_MS);
    };
    const alCambiarVisibilidad = () => {
      if (document.hidden) {
        detener();
      } else {
        refrescar();
        iniciar();
      }
    };

    if (!document.hidden) iniciar();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    return () => {
      detener();
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, [router]);

  return null;
}
