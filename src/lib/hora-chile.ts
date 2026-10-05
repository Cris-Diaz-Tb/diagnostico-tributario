/**
 * Todas las fechas que ve el equipo van en hora de Chile. Los servidores
 * de Vercel corren en UTC, así que sin fijar la zona el panel y las
 * exportaciones salían 3 o 4 horas adelantadas. America/Santiago resuelve
 * solo el cambio de horario de verano e invierno.
 */
export const ZONA_CHILE = "America/Santiago";

function partes(fecha: Date): Record<string, string> {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_CHILE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return Object.fromEntries(fmt.formatToParts(fecha).map((p) => [p.type, p.value]));
}

/** "2026-10-05": el día en Chile. */
export function diaChile(fecha: Date | string = new Date()): string {
  const p = partes(new Date(fecha));
  return `${p.year}-${p.month}-${p.day}`;
}

/** "2026-10-05 10:30": para exportaciones. */
export function fechaHoraChile(fecha: Date | string): string {
  const p = partes(new Date(fecha));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/** Instante (ISO, UTC) en que empieza un día "AAAA-MM-DD" en Chile. */
export function inicioDelDiaChile(dia: string): string {
  // El desfase de ese día: "GMT-03:00" o "GMT-04:00".
  const desfase = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_CHILE,
    timeZoneName: "longOffset",
  })
    .formatToParts(new Date(`${dia}T12:00:00Z`))
    .find((p) => p.type === "timeZoneName")!
    .value.replace("GMT", "");
  return new Date(`${dia}T00:00:00${desfase || "Z"}`).toISOString();
}
