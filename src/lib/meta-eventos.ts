/**
 * Contrato compartido entre el pixel (navegador) y la API de Conversiones
 * (servidor). Vive aparte a propósito: ambos lados DEBEN mandar el mismo
 * `event_id` para el mismo hecho, o Meta contaría cada conversión dos veces.
 */

export type EventoMeta =
  /** Estándar de Meta — el evento a optimizar en las campañas. */
  | "Lead"
  /** Personalizados: apoyo para audiencias y análisis del embudo. */
  | "DiagnosticoIniciado"
  | "DiagnosticoCompletado"
  | "DiagnosticoAbandonado";

/**
 * Cada sesión de diagnóstico tiene un id base; cada evento deriva el suyo
 * de forma determinista. Así el navegador y el servidor llegan al mismo
 * id sin tener que pasárselo en cada llamada.
 */
export function idDeEvento(base: string, evento: EventoMeta): string {
  return `${base}.${evento}`;
}

/** Id base de la sesión. Se genera una vez en el navegador. */
export function nuevoIdBase(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
