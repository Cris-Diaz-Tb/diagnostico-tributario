import { etapaDeFase, ROADMAPS } from "@/content/roadmaps";
import { NOMBRE_RUTA, TEXTO_INTENCION, TEXTO_PROBLEMA } from "@/content/preguntas";
import { ofertaRecomendada } from "@/content/ofertas";
import type { FaseId, Ruta } from "@/content/tipos";
import type { RespuestaDetallada } from "@/lib/scoring";

/**
 * Resumen del diagnóstico en texto plano para el bot de WhatsApp de GHL.
 *
 * Va a un campo personalizado del contacto ({{contact.diag_contexto}}) y
 * el bot lo lee como contexto de la conversación: qué respondió, en qué
 * etapa quedó y qué servicio corresponde ofrecer.
 *
 * Sin precios a propósito: el precio lo maneja el prompt del bot, no los
 * datos del diagnóstico (regla de marca de src/content/ofertas.ts).
 */

export interface DiagnosticoParaContexto {
  codigo: string;
  nombre: string | null;
  fase: FaseId;
  score: number | null;
  problema: string | null;
  problemaOtro: string | null;
  nivelIntencion: string | null;
  /** "Entre 5 y 10 propiedades"; null en diagnósticos anteriores al rango. */
  propiedades?: string | null;
  textoAbierto: string | null;
  respuestas: RespuestaDetallada[] | null;
}

/** Tope holgado para un campo de texto largo de GHL. */
export const MAX_CONTEXTO = 3500;

export function contextoParaBot(d: DiagnosticoParaContexto): string {
  const ruta = d.fase[0] as Ruta;
  const roadmap = ROADMAPS[d.fase];
  const oferta = ofertaRecomendada(d.fase, d.problema);

  const problema = d.problema
    ? [TEXTO_PROBLEMA[d.problema] ?? d.problema, d.problemaOtro].filter(Boolean).join(": ")
    : "No lo indicó";

  const lineas = [
    `Código: ${d.codigo}`,
    d.nombre ? `Nombre: ${d.nombre}` : null,
    d.propiedades ? `Propiedades: ${d.propiedades}` : null,
    `Resultado: ${NOMBRE_RUTA[ruta]}, etapa ${etapaDeFase(d.fase)} de 3 (${d.fase})`,
    d.score !== null ? `Puntaje: ${d.score}` : null,
    `Problema principal: ${problema}`,
    d.nivelIntencion
      ? `Qué ha hecho hasta ahora: ${TEXTO_INTENCION[d.nivelIntencion] ?? d.nivelIntencion}`
      : null,
    `Servicio recomendado: ${oferta.nombre}`,
    "",
    `Diagnóstico que vio: ${roadmap.parteA.titulo}. ${roadmap.parteA.diagnostico}`,
    "",
    "Pasos que se le recomendaron:",
    ...roadmap.parteB.pasos.map((p, i) => `${i + 1}. ${p}`),
  ];

  const respuestas = (d.respuestas ?? []).filter((r) => r.opcionId !== "texto_libre");
  if (respuestas.length > 0) {
    lineas.push("", "Respuestas:");
    for (const r of respuestas) lineas.push(`- ${r.pregunta} → ${r.opcion}`);
  }

  if (d.textoAbierto) lineas.push("", `Lo que escribió de su caso: ${d.textoAbierto}`);

  const texto = lineas.filter((l): l is string => l !== null).join("\n");
  return texto.length > MAX_CONTEXTO ? `${texto.slice(0, MAX_CONTEXTO - 1)}…` : texto;
}
