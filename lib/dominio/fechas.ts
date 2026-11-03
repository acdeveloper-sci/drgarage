const formato = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

// "2 nov, 10:42 a. m." en hora de Bogotá. Se arma por partes porque el texto de
// Intl varía según la versión de ICU ("2 de nov", "nov.", espacios no separables).
export function formatearFecha(fechaUtc: Date): string {
  const partes: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const { type, value } of formato.formatToParts(fechaUtc)) partes[type] = value;
  const mes = partes.month!.replace(".", "");
  const periodo = partes.dayPeriod!.replace(/\s+/g, " ");
  return `${partes.day} ${mes}, ${partes.hour}:${partes.minute} ${periodo}`;
}
