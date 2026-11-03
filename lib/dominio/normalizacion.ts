export const ERROR_WHATSAPP = "Revisa el WhatsApp: debe tener 10 dígitos, por ejemplo 300 123 4567.";

// "KMT 482" y "kmt-482" → "KMT482".
export function normalizarPlaca(placa: string): string {
  return placa.replace(/[\s-]/g, "").toUpperCase();
}

export type ResultadoWhatsApp = { ok: true; whatsapp: string } | { ok: false; error: string };

// Acepta el número con espacios o guiones ("300 123 4567"); devuelve solo los 10 dígitos.
export function validarWhatsApp(entrada: string): ResultadoWhatsApp {
  const whatsapp = entrada.replace(/[\s-]/g, "");
  return /^[0-9]{10}$/.test(whatsapp) ? { ok: true, whatsapp } : { ok: false, error: ERROR_WHATSAPP };
}
