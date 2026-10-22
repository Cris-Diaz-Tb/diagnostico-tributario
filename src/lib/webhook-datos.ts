import "server-only";
import { createHmac } from "node:crypto";
import { getSupabase } from "@/lib/supabase";
import { valorConfig } from "@/lib/configuracion";
import { registroParaIA, type FilaIA } from "@/lib/exportacion-ia";
import { datosDeOrigen } from "@/content/origenes";

/**
 * Webhook de salida con los datos del diagnóstico, para analizarlos fuera
 * (n8n, Make, Sheets). Una sola URL recibe los dos espacios: cada envío
 * lleva `origen`, y el flujo los separa con un Switch.
 *
 * El registro es el mismo de la exportación para IA (preguntas completas,
 * etiquetas en texto legible) más el contacto y los datos crudos.
 *
 * Autenticación: si está WEBHOOK_DATOS_SECRET, va en `x-webhook-secret`
 * y `x-firma` lleva el HMAC-SHA256 del cuerpo.
 *
 * Sin URL no hace nada. Un fallo nunca rompe el flujo: el dato ya está en
 * Supabase y se puede reenviar con el botón de histórico.
 */

export const EVENTOS_WEBHOOK = [
  // Mismos nombres que los eventos de Meta y las etapas del panel.
  "diagnostico.incompleto",
  "diagnostico.completado",
  "diagnostico.abandonado",
  "diagnostico.accion",
  "diagnostico.historico",
  "diagnostico.prueba",
] as const;
export type EventoWebhook = (typeof EVENTOS_WEBHOOK)[number];

/** Fila de `diagnosticos_embudo` (select *) con lo que usa el payload. */
export interface FilaWebhook extends FilaIA {
  origen: string | null;
  estado: string;
  token_resultado: string;
  accion_resultado?: string | null;
  version_cuestionario?: string | null;
  preguntas_respondidas?: number | null;
  total_preguntas?: number | null;
  ultima_pregunta_id?: string | null;
  referrer?: string | null;
  completado_at?: string | null;
  email_capturado_at?: string | null;
  accion_resultado_at?: string | null;
}

const TIMEOUT_MS = 5000;

export function payloadDeFila(fila: FilaWebhook, evento: EventoWebhook, ahora = new Date()) {
  // `segmento` se reemplaza por estado y estado_efectivo, que son exactos
  // en cada evento (justo al completar, la vista todavía dice "en_curso").
  const { origen: utm, ...conSegmento } = registroParaIA(fila, true);
  const registro: Omit<typeof conSegmento, "segmento"> & { segmento?: string } = conSegmento;
  delete registro.segmento;
  const origen = datosDeOrigen(fila.origen);
  return {
    evento,
    enviado_at: ahora.toISOString(),
    id: fila.id,
    origen: fila.origen ?? "directo",
    origen_nombre: origen.nombre,
    es_lanzamiento: Boolean(origen.esLanzamiento),
    estado: fila.estado,
    estado_efectivo: fila.estado_efectivo,
    ...registro,
    accion_resultado: fila.accion_resultado ?? null,
    version_cuestionario: fila.version_cuestionario ?? null,
    preguntas_respondidas: fila.preguntas_respondidas ?? null,
    total_preguntas: fila.total_preguntas ?? null,
    ultima_pregunta_id: fila.ultima_pregunta_id ?? null,
    utm,
    referrer: fila.referrer ?? null,
    fechas: {
      creado: fila.fecha_creacion,
      completado: fila.completado_at ?? null,
      capturado: fila.email_capturado_at ?? null,
      accion: fila.accion_resultado_at ?? null,
    },
    url_resultado: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/resultado/${fila.token_resultado}`,
  };
}

export type PayloadWebhook = ReturnType<typeof payloadDeFila>;

export function firmar(cuerpo: string, secreto: string): string {
  return `sha256=${createHmac("sha256", secreto).update(cuerpo).digest("hex")}`;
}

/** POST al webhook con timeout y un reintento. true si respondió 2xx. */
export async function postWebhook(
  url: string,
  payload: unknown,
  secreto = process.env.WEBHOOK_DATOS_SECRET?.trim()
): Promise<boolean> {
  const cuerpo = JSON.stringify(payload);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secreto) {
    headers["x-webhook-secret"] = secreto;
    headers["x-firma"] = firmar(cuerpo, secreto);
  }

  for (let intento = 1; intento <= 2; intento++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: cuerpo,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) return true;
      console.error(`[webhook-datos] El webhook respondió ${res.status} (intento ${intento}).`);
      // Un 4xx no se arregla reintentando.
      if (res.status < 500) return false;
    } catch (err) {
      console.error(`[webhook-datos] Fallo enviando (intento ${intento}):`, err);
    }
  }
  return false;
}

export async function urlWebhookDatos(): Promise<string | undefined> {
  return valorConfig("webhook_datos_url");
}

/**
 * Lee el diagnóstico (por id o token del resultado) y lo envía. Pensado
 * para llamarse dentro de `after()`: nunca lanza.
 */
export async function enviarWebhookDatos(
  evento: EventoWebhook,
  donde: { id: string } | { token: string }
): Promise<boolean> {
  try {
    const url = await urlWebhookDatos();
    if (!url) return false;
    const supabase = getSupabase();
    if (!supabase) return false;

    const [columna, valor] = "id" in donde ? ["id", donde.id] : ["token_resultado", donde.token];
    const { data, error } = await supabase
      .from("diagnosticos_embudo")
      .select("*")
      .eq(columna, valor)
      .maybeSingle();
    if (error || !data) {
      console.error("[webhook-datos] No se encontró el diagnóstico:", error ?? valor);
      return false;
    }
    return await postWebhook(url, payloadDeFila(data as FilaWebhook, evento));
  } catch (err) {
    console.error("[webhook-datos] Error inesperado:", err);
    return false;
  }
}

/** Envía varias filas en paralelo de a pocas. Devuelve cuántas llegaron. */
export async function enviarFilasWebhook(
  url: string,
  filas: FilaWebhook[],
  evento: EventoWebhook,
  enParalelo = 8
): Promise<{ enviados: number; fallidos: number }> {
  let enviados = 0;
  for (let i = 0; i < filas.length; i += enParalelo) {
    const lote = filas.slice(i, i + enParalelo);
    const resultados = await Promise.all(lote.map((f) => postWebhook(url, payloadDeFila(f, evento))));
    enviados += resultados.filter(Boolean).length;
  }
  return { enviados, fallidos: filas.length - enviados };
}

/** Diagnóstico de ejemplo para el botón "Enviar prueba" del panel. */
export function filaDePrueba(): FilaWebhook {
  const ahora = new Date().toISOString();
  return {
    id: "00000000-prueba-0000-0000-000000000000",
    token_resultado: "prueba",
    origen: "directo",
    estado: "capturado",
    estado_efectivo: "capturado",
    fecha_creacion: ahora,
    completado_at: ahora,
    email_capturado_at: ahora,
    es_prueba: true,
    nombre: "Prueba Webhook",
    email: "prueba@ejemplo.cl",
    telefono: "+56900000000",
    ruta: "A",
    fase: "A2",
    score_numerico: 12,
    respuestas: [],
    problema_principal: null,
    problema_otro: null,
    nivel_intencion: null,
    texto_abierto: "Esto es un envío de prueba desde /admin/configuracion.",
    oferta_recomendada: null,
    utm_source: "prueba",
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    propiedades_rango: null,
  };
}
