/**
 * Botones de "Tu siguiente paso". El mismo nombre se usa en PostHog, en
 * el pixel de Meta (evento personalizado) y en la columna
 * accion_resultado del diagnóstico.
 */
export const ACCIONES_RESULTADO = ["clic_agendar", "clic_whatsapp", "clic_webinar"] as const;

export type AccionResultado = (typeof ACCIONES_RESULTADO)[number];

export function esAccionResultado(valor: unknown): valor is AccionResultado {
  return ACCIONES_RESULTADO.includes(valor as AccionResultado);
}
