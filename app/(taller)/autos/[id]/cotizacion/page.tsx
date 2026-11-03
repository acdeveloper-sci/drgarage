import { notFound } from "next/navigation";
import { AppHeaderVolver } from "@/components/ui/AppHeader";
import { obtenerAutoPorId } from "@/lib/supabase/consultas";
import { FormularioCotizacion } from "./FormularioCotizacion";

// Pantalla "Cotización adicional" (captura 08).
export default async function CotizacionAdicional({ params }: PageProps<"/autos/[id]/cotizacion">) {
  const { id } = await params;
  const auto = await obtenerAutoPorId(id);
  if (!auto) notFound();

  return (
    <>
      <AppHeaderVolver href={`/autos/${auto.id}`} etiquetaVolver="Volver a la ficha del auto" sub={`${auto.placa} · ${auto.modelo}`}>
        <h1>Cotización adicional</h1>
      </AppHeaderVolver>
      <FormularioCotizacion autoId={auto.id} />
    </>
  );
}
