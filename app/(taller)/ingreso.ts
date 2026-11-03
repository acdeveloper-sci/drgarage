// Tipos y lectura del formulario de ingreso, compartidos por la Server Action y el componente de cliente.

export interface ValoresIngreso {
  nombre: string;
  whatsapp: string;
  placa: string;
  modelo: string;
  problema: string;
}

export type EstadoIngreso =
  | { tipo: "inicial"; valores: ValoresIngreso }
  | { tipo: "error"; valores: ValoresIngreso; error: string; conexion: boolean }
  | { tipo: "guardado"; valores: ValoresIngreso; id: string };

export function leerValores(datos: FormData): ValoresIngreso {
  const campo = (nombre: string) => String(datos.get(nombre) ?? "");
  return { nombre: campo("nombre"), whatsapp: campo("whatsapp"), placa: campo("placa"), modelo: campo("modelo"), problema: campo("problema") };
}
