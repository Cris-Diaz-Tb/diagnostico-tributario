"use client";

import posthog from "posthog-js";
import type { AccionResultado } from "./accion-resultado";

/**
 * Wrapper de analytics (PostHog). Sin NEXT_PUBLIC_POSTHOG_KEY → no-op.
 * Eventos del funnel (la Fase 4 del proyecto depende de esta data):
 *   quiz_iniciado · pregunta_respondida · quiz_completado ·
 *   email_capturado · resultado_visitado ·
 *   clic_agendar · clic_whatsapp · clic_webinar (botones del resultado)
 */

let inicializado = false;

function asegurarInit(): boolean {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return false;
  if (!inicializado) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: true,
    });
    inicializado = true;
  }
  return true;
}

export function trackEvento(
  evento:
    | "quiz_iniciado"
    | "pregunta_respondida"
    | "quiz_completado"
    | "email_capturado"
    | "resultado_visitado"
    | AccionResultado,
  props?: Record<string, string | number | null>
): void {
  if (!asegurarInit()) return;
  posthog.capture(evento, props);
}
