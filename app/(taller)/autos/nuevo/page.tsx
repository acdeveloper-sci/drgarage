import { AppHeaderVolver } from "@/components/ui/AppHeader";
import { FormularioIngreso } from "./FormularioIngreso";

export default function IngresarAuto() {
  return (
    <>
      <AppHeaderVolver href="/" etiquetaVolver="Volver a la lista">
        <h1>Ingresar auto</h1>
      </AppHeaderVolver>
      <FormularioIngreso />
    </>
  );
}
