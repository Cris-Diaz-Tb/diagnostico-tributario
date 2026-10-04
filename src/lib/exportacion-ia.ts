import {
  NOMBRE_RUTA,
  TEXTO_INTENCION,
  TEXTO_PROBLEMA,
  respuestaBifurcacion,
} from "@/content/preguntas";
import { OFERTAS } from "@/content/ofertas";
import { ROADMAPS } from "@/content/roadmaps";
import type { FaseId, OfertaId, Ruta } from "@/content/tipos";
import type { RespuestaDetallada } from "@/lib/scoring";

/**
 * Exportación de respuestas pensada para analizarlas con IA (Claude,
 * ChatGPT). A diferencia del CSV, cada respuesta va junto al texto
 * completo de su pregunta y las etiquetas internas se traducen a texto
 * legible, para que el modelo no tenga que adivinar qué es "a8: otro".
 *
 * Por defecto NO incluye nombre, email ni teléfono: el análisis de
 * patrones no los necesita y así no se suben datos personales a un
 * servicio externo.
 */

export const SEGMENTOS_IA = ["capturado", "abandono_gate"] as const;
export type SegmentoIA = (typeof SEGMENTOS_IA)[number];

export const TEXTO_SEGMENTO: Record<SegmentoIA, string> = {
  capturado: "Completó y dejó sus datos",
  abandono_gate: "Vio su fase y no dejó sus datos (abandonó en el gate)",
};

export type FormatoIA = "md" | "jsonl";

/** Columnas de diagnosticos_embudo que necesita la exportación. */
export const COLUMNAS_IA =
  "id, fecha_creacion, estado_efectivo, nombre, email, telefono, ruta, fase, score_numerico, respuestas, problema_principal, problema_otro, nivel_intencion, texto_abierto, oferta_recomendada, utm_source, utm_medium, utm_campaign, utm_content, utm_term, whatsapp_iniciado_at, es_prueba";

export interface FilaIA {
  id: string;
  fecha_creacion: string;
  estado_efectivo: string;
  nombre?: string | null;
  email?: string | null;
  telefono?: string | null;
  ruta: Ruta;
  fase: FaseId | null;
  score_numerico: number | null;
  respuestas: RespuestaDetallada[] | null;
  problema_principal: string | null;
  problema_otro: string | null;
  nivel_intencion: string | null;
  texto_abierto: string | null;
  oferta_recomendada: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term?: string | null;
  whatsapp_iniciado_at?: string | null;
  es_prueba?: boolean;
}

export interface RegistroIA {
  codigo: string;
  fecha: string;
  segmento: string;
  es_prueba: boolean;
  /** Respuesta a la pregunta que define la ruta. */
  propiedades: string;
  ruta: string;
  fase: string | null;
  fase_titulo: string | null;
  score: number | null;
  problema_principal: string | null;
  problema_otro: string | null;
  intencion_previa: string | null;
  texto_libre: string | null;
  oferta_recomendada: string | null;
  escribio_por_whatsapp: boolean;
  origen: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    content: string | null;
    term: string | null;
  };
  respuestas: Array<{ pregunta: string; respuesta: string }>;
  contacto?: { nombre: string | null; email: string | null; telefono: string | null };
}

/** Mismo código corto que ve la persona y que usa el bot de WhatsApp. */
function codigoDe(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function registroParaIA(fila: FilaIA, incluirContacto: boolean): RegistroIA {
  const registro: RegistroIA = {
    codigo: codigoDe(fila.id),
    fecha: fila.fecha_creacion.slice(0, 10),
    segmento: TEXTO_SEGMENTO[fila.estado_efectivo as SegmentoIA] ?? fila.estado_efectivo,
    es_prueba: Boolean(fila.es_prueba),
    propiedades: respuestaBifurcacion(fila.ruta).respuesta,
    ruta: `${fila.ruta} · ${NOMBRE_RUTA[fila.ruta]}`,
    fase: fila.fase,
    fase_titulo: fila.fase ? ROADMAPS[fila.fase].parteA.titulo : null,
    score: fila.score_numerico,
    problema_principal: fila.problema_principal
      ? (TEXTO_PROBLEMA[fila.problema_principal] ?? fila.problema_principal)
      : null,
    problema_otro: fila.problema_otro,
    intencion_previa: fila.nivel_intencion
      ? (TEXTO_INTENCION[fila.nivel_intencion] ?? fila.nivel_intencion)
      : null,
    texto_libre: fila.texto_abierto,
    oferta_recomendada: fila.oferta_recomendada
      ? (OFERTAS[fila.oferta_recomendada as OfertaId]?.nombre ?? fila.oferta_recomendada)
      : null,
    escribio_por_whatsapp: Boolean(fila.whatsapp_iniciado_at),
    origen: {
      source: fila.utm_source,
      medium: fila.utm_medium,
      campaign: fila.utm_campaign,
      content: fila.utm_content,
      term: fila.utm_term ?? null,
    },
    // La bifurcación no está en `respuestas`: se antepone para que el
    // análisis vea la pregunta que define la ruta.
    respuestas: [
      respuestaBifurcacion(fila.ruta),
      ...(fila.respuestas ?? []).map((r) => ({ pregunta: r.pregunta, respuesta: r.opcion })),
    ],
  };

  if (incluirContacto) {
    registro.contacto = {
      nombre: fila.nombre ?? null,
      email: fila.email ?? null,
      telefono: fila.telefono ?? null,
    };
  }

  return registro;
}

/** Una línea JSON por persona: el formato más cómodo para procesar por lotes con la API. */
export function exportarJsonl(filas: FilaIA[], incluirContacto: boolean): string {
  return filas.map((f) => JSON.stringify(registroParaIA(f, incluirContacto))).join("\n") + "\n";
}

export const PROMPT_SUGERIDO = `Analiza estas respuestas del diagnóstico tributario para inversionistas inmobiliarios en Chile. Compara a quienes dejaron sus datos con quienes vieron su fase y abandonaron en el gate:
1. Qué patrones de respuesta, ruta, fase, problema principal e intención previa distinguen a cada grupo.
2. Qué dolores y objeciones aparecen en los textos libres, agrupados por tema y con citas textuales.
3. Hipótesis de por qué abandonan en el gate y qué cambiarías en la página de resultado para reducirlo.
4. Ángulos y frases para anuncios que salgan del lenguaje real de las personas.
Cita siempre el código del diagnóstico cuando uses un caso como ejemplo.`;

function linea(etiqueta: string, valor: string | number | null | undefined): string | null {
  if (valor === null || valor === undefined || valor === "") return null;
  return `- **${etiqueta}:** ${valor}`;
}

function bloqueMarkdown(r: RegistroIA): string {
  const origen = [r.origen.source, r.origen.medium, r.origen.campaign, r.origen.content, r.origen.term]
    .filter(Boolean)
    .join(" / ");
  const partes = [
    `## Diagnóstico ${r.codigo}`,
    "",
    ...[
      linea("Segmento", r.segmento),
      r.es_prueba ? linea("Prueba interna", "sí, no es un lead real") : null,
      linea("Fecha", r.fecha),
      linea("Propiedades", r.propiedades),
      linea("Ruta", r.ruta),
      linea("Fase", r.fase ? `${r.fase}, "${r.fase_titulo}"` : null),
      linea("Score", r.score),
      linea("Problema principal", r.problema_principal),
      linea("Problema (texto propio)", r.problema_otro),
      linea("Qué ha hecho antes", r.intencion_previa),
      linea("Oferta recomendada", r.oferta_recomendada),
      linea("Escribió por WhatsApp", r.escribio_por_whatsapp ? "sí" : "no"),
      linea("Origen", origen || "directo"),
      r.contacto &&
        linea(
          "Contacto",
          [r.contacto.nombre, r.contacto.email, r.contacto.telefono].filter(Boolean).join(" · ")
        ),
    ].filter((l): l is string => Boolean(l)),
  ];

  if (r.respuestas.length > 0) {
    partes.push("", "**Respuestas:**", "");
    r.respuestas.forEach((resp, i) => {
      partes.push(`${i + 1}. ${resp.pregunta}`, `   → ${resp.respuesta.replace(/\s*\n\s*/g, " ")}`);
    });
  }

  return partes.join("\n");
}

/** Un documento listo para pegar o adjuntar en un chat con IA, con el contexto y un prompt al inicio. */
export function exportarMarkdown(
  filas: FilaIA[],
  incluirContacto: boolean,
  generado: Date = new Date()
): string {
  const pruebas = filas.filter((f) => f.es_prueba).length;
  const registros = filas.map((f) => registroParaIA(f, incluirContacto));
  const conteo = SEGMENTOS_IA.map(
    (s) => `- ${TEXTO_SEGMENTO[s]}: ${filas.filter((f) => f.estado_efectivo === s).length}`
  );

  const encabezado = [
    "# Respuestas del diagnóstico tributario de Cris",
    "",
    `Exportado el ${generado.toISOString().slice(0, 10)}. ${registros.length} diagnósticos completos:`,
    "",
    ...conteo,
    ...(pruebas > 0 ? [`- De ellos, pruebas internas del equipo: ${pruebas}`] : []),
    "",
    "## Contexto",
    "",
    "Quiz para inversionistas inmobiliarios en Chile. La primera pregunta (cuántas propiedades tiene) define la ruta: A hasta 5, B de 6 a 15, C 16 o más. Las preguntas puntuadas suman un score que ubica a la persona en una fase (1 = más desordenada, 3 = más avanzada). Al terminar ve el título de su fase y, para ver el plan completo, debe dejar nombre, email y WhatsApp (el gate). El origen es utm source / medium / campaign / content / term.",
    "",
    "## Qué analizar",
    "",
    PROMPT_SUGERIDO,
    "",
    "---",
    "",
  ];

  return [...encabezado, registros.map(bloqueMarkdown).join("\n\n---\n\n"), ""].join("\n");
}
