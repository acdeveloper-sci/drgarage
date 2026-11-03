export const ERROR_WHATSAPP = "Revisa el WhatsApp: debe tener 10 dígitos, por ejemplo 300 123 4567.";

export function normalizarPlaca(placa: string): string {
  return placa.toUpperCase();
}

export type ResultadoWhatsApp = { ok: true; whatsapp: string } | { ok: false; error: string };

// Acepta el número con espacios o guiones ("300 123 4567"); devuelve solo los 10 dígitos.
export function validarWhatsApp(entrada: string): ResultadoWhatsApp {
  const whatsapp = entrada.replace(/[\s-]/g, "");
  return /^[0-9]{10}$/.test(whatsapp) ? { ok: true, whatsapp } : { ok: false, error: ERROR_WHATSAPP };
}
