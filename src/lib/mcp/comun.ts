import "server-only";
import { z } from "zod";
import { IDS_ORIGEN, type OrigenId } from "@/content/origenes";
import {
  NOMBRE_RUTA,
  TEXTO_INTENCION,
  TEXTO_PROBLEMA,
  esAvatar,
  rangoDePropiedades,
} from "@/content/preguntas";
import { FASES, ROADMAPS } from "@/content/roadmaps";
import { diaChile } from "@/lib/hora-chile";
import type { FilaWebhook } from "@/lib/webhook-datos";

/** Piezas compartidas por las herramientas del MCP. */

export interface Herramienta<S extends z.ZodType = z.ZodType> {
  nombre: string;
  titulo: string;
  descripcion: string;
  esquema: S;
  ejecutar: (args: z.infer<S>) => Promise<unknown>;
}

export function herramienta<S extends z.ZodType>(h: Herramienta<S>): Herramienta<S> {
  return h;
}

export const esquemaOrigen = z
  .enum(IDS_ORIGEN as [OrigenId, ...OrigenId[]])
  .optional()
  .describe("Espacio de datos. Vacío = todos, separados por espacio en los resúmenes.");
export const esquemaDia = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD");
export const esquemaRango = {
  desde: esquemaDia.optional().describe("Desde este día en Chile (YYYY-MM-DD), inclusive."),
  hasta: esquemaDia.optional().describe("Hasta este día en Chile (YYYY-MM-DD), inclusive."),
};
export const esquemaRuta = z
  .enum(["A", "B", "C"])
  .optional()
  .describe("Ruta del quiz (la define cuántas propiedades tiene; ver listar_espacios).");
export const esquemaPruebas = z
  .boolean()
  .optional()
  .describe("Incluir pruebas internas del equipo (por defecto no).");

export const pct = (parte: number, total: number) =>
  total ? Math.round((parte / total) * 1000) / 10 : 0;

export function contar<T>(items: T[], clave: (t: T) => string | null | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of items) {
    const k = clave(i) ?? "(sin dato)";
    out[k] = (out[k] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1]));
}

export const vioGate = (f: FilaWebhook) => f.estado === "completado" || f.estado === "capturado";
export const completo = (f: FilaWebhook) => f.estado === "capturado";

export const textoProblema = (f: FilaWebhook) =>
  f.problema_principal ? (TEXTO_PROBLEMA[f.problema_principal] ?? f.problema_principal) : null;

/**
 * Dimensiones para agrupar y cruzar. `respuesta:<preguntaId>` agrupa por
 * la opción elegida en esa pregunta.
 */
export const DIMENSIONES = [
  "etapa",
  "vio_gate",
  "completo",
  "ruta",
  "fase",
  "propiedades",
  "avatar",
  "problema",
  "intencion",
  "accion_resultado",
  "whatsapp",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "dia",
  "semana",
  "espacio",
] as const;

function lunesDe(fecha: string): string {
  const d = new Date(`${diaChile(fecha)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function valorDimension(f: FilaWebhook, dim: string): string | null {
  if (dim.startsWith("respuesta:")) {
    const id = dim.slice("respuesta:".length);
    return f.respuestas?.find((r) => r.preguntaId === id)?.opcion ?? null;
  }
  switch (dim) {
    case "etapa":
      return f.estado_efectivo;
    case "vio_gate":
      return vioGate(f) ? "sí" : "no";
    case "completo":
      return completo(f) ? "sí" : "no";
    case "ruta":
      return `${f.ruta} · ${NOMBRE_RUTA[f.ruta]}`;
    case "fase":
      return f.fase;
    case "propiedades":
      return rangoDePropiedades(f.propiedades_rango)?.texto ?? null;
    case "avatar": {
      const a = esAvatar(f.ruta, f.propiedades_rango);
      return a === null ? null : a ? "sí" : "no";
    }
    case "problema":
      return textoProblema(f);
    case "intencion":
      return f.nivel_intencion ? (TEXTO_INTENCION[f.nivel_intencion] ?? f.nivel_intencion) : null;
    case "accion_resultado":
      return f.accion_resultado ?? null;
    case "whatsapp":
      return f.whatsapp_iniciado_at ? "sí" : "no";
    case "utm_source":
    case "utm_medium":
    case "utm_campaign":
    case "utm_content":
      return f[dim] ?? null;
    case "dia":
      return diaChile(f.fecha_creacion);
    case "semana":
      return `semana del ${lunesDe(f.fecha_creacion)}`;
    case "espacio":
      return f.origen;
    default:
      return null;
  }
}

export const esquemaDimension = z
  .string()
  .refine(
    (d) => (DIMENSIONES as readonly string[]).includes(d) || /^respuesta:[a-z0-9_]{1,30}$/.test(d),
    `Usa una de: ${DIMENSIONES.join(", ")}, o respuesta:<id de pregunta> (ver ver_cuestionario).`
  );

/** Embudo de un grupo de filas: lo usan resumen_embudo y comparar_periodos. */
export function embudo(filas: FilaWebhook[]) {
  const iniciados = filas.length;
  const gate = filas.filter(vioGate);
  const completados = filas.filter(completo);
  const conFase = gate.filter((f) => f.fase);
  const scores = conFase.map((f) => f.score_numerico).filter((s): s is number => s !== null);

  return {
    iniciados,
    vieron_gate: gate.length,
    completados: completados.length,
    pct_llega_al_gate: pct(gate.length, iniciados),
    pct_completa_desde_gate: pct(completados.length, gate.length),
    pct_completa_de_iniciados: pct(completados.length, iniciados),
    por_etapa: contar(filas, (f) => f.estado_efectivo),
    por_ruta: Object.fromEntries(
      (["A", "B", "C"] as const).map((r) => {
        const deRuta = filas.filter((f) => f.ruta === r);
        return [r, { nombre: NOMBRE_RUTA[r], iniciados: deRuta.length, completados: deRuta.filter(completo).length }];
      })
    ),
    por_fase: Object.fromEntries(
      FASES.filter((fase) => conFase.some((f) => f.fase === fase)).map((fase) => {
        const deFase = conFase.filter((f) => f.fase === fase);
        return [
          fase,
          {
            titulo: ROADMAPS[fase].parteA.titulo,
            vieron_gate: deFase.length,
            completados: deFase.filter(completo).length,
          },
        ];
      })
    ),
    score_promedio: scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null,
    problema_principal: contar(conFase, textoProblema),
    avatar_5_o_mas: gate.filter((f) => esAvatar(f.ruta, f.propiedades_rango) === true).length,
    accion_en_resultado: contar(completados.filter((f) => f.accion_resultado), (f) => f.accion_resultado),
    escribieron_por_whatsapp: filas.filter((f) => f.whatsapp_iniciado_at).length,
  };
}
