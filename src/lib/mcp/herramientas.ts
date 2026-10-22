import "server-only";
import { z } from "zod";
import { IDS_ORIGEN, ORIGENES, datosDeOrigen, type OrigenId } from "@/content/origenes";
import { NOMBRE_RUTA, preguntasDeRuta } from "@/content/preguntas";
import { FASES, ROADMAPS } from "@/content/roadmaps";
import { diaChile } from "@/lib/hora-chile";
import { payloadDeFila, type FilaWebhook } from "@/lib/webhook-datos";
import {
  completo,
  embudo,
  esquemaOrigen as origen,
  esquemaPruebas as incluirPruebas,
  esquemaRango as rango,
  esquemaRuta as ruta,
  herramienta,
  pct,
  textoProblema,
  vioGate,
} from "./comun";
import { ETAPAS, TEXTO_ETAPA, buscarDiagnosticos, type Etapa, type Filtros } from "./datos";
import { HERRAMIENTAS_ANALISIS } from "./herramientas-analisis";
import { HERRAMIENTAS_CONTENIDO } from "./herramientas-contenido";
import { HERRAMIENTAS_GHL } from "./herramientas-ghl";

/**
 * Herramientas del MCP de diagnósticos. Todas son de solo lectura.
 *
 * Etapas (iguales al panel y a Meta):
 *   en_curso → abandono_preguntas | abandono_gate (DiagnosticoIncompleto)
 *   | capturado (DiagnosticoCompletado: dejó sus datos).
 */

/** Aplica `fn` por espacio cuando no se pidió uno concreto. */
async function porEspacio(
  pedido: OrigenId | undefined,
  filtros: Filtros,
  fn: (filas: FilaWebhook[]) => unknown
): Promise<unknown> {
  const { filas, total } = await buscarDiagnosticos({ ...filtros, origen: pedido });
  const aviso = total > filas.length ? `Solo se analizaron ${filas.length} de ${total}.` : undefined;
  const espacios = pedido ? [pedido] : IDS_ORIGEN;
  const resultado = Object.fromEntries(
    espacios.map((o) => [
      o,
      { nombre: datosDeOrigen(o).nombre, ...(fn(filas.filter((f) => f.origen === o)) as object) },
    ])
  );
  return aviso ? { aviso, espacios: resultado } : { espacios: resultado };
}

function abandonos(filas: FilaWebhook[]) {
  const enPreguntas = filas.filter((f) => f.estado_efectivo === "abandono_preguntas");
  const grupos = new Map<string, { ruta: string; ultima: string | null; respondidas: number; n: number }>();
  for (const f of enPreguntas) {
    const k = `${f.ruta}|${f.ultima_pregunta_id ?? ""}`;
    const g = grupos.get(k) ?? {
      ruta: f.ruta,
      ultima: f.ultima_pregunta_id ?? null,
      respondidas: f.preguntas_respondidas ?? 0,
      n: 0,
    };
    g.n += 1;
    grupos.set(k, g);
  }

  const detalle = [...grupos.values()]
    .sort((a, b) => b.n - a.n)
    .map((g) => {
      const preguntas = preguntasDeRuta(g.ruta as "A" | "B" | "C");
      const i = preguntas.findIndex((p) => p.id === g.ultima);
      const siguiente = preguntas[i + 1];
      return {
        ruta: g.ruta,
        abandonos: g.n,
        preguntas_respondidas: g.respondidas,
        de_total: preguntas.length,
        ultima_respondida: i >= 0 ? preguntas[i].texto : "(ninguna: se fue en la bifurcación o la primera)",
        se_fue_en: siguiente?.texto ?? null,
        pregunta_id: siguiente?.id ?? g.ultima,
      };
    });

  return {
    abandonaron_en_preguntas: enPreguntas.length,
    abandonaron_en_gate: filas.filter((f) => f.estado_efectivo === "abandono_gate").length,
    por_pregunta: detalle,
  };
}

function atribucion(filas: FilaWebhook[]) {
  const grupos = new Map<string, FilaWebhook[]>();
  for (const f of filas) {
    const k = [f.utm_source ?? "(directo)", f.utm_medium ?? "-", f.utm_campaign ?? "-", f.utm_content ?? "-"].join(
      " | "
    );
    grupos.set(k, [...(grupos.get(k) ?? []), f]);
  }
  return {
    columnas: "source | medium | campaign | content",
    filas: [...grupos.entries()]
      .map(([k, fs]) => {
        const gate = fs.filter(vioGate).length;
        const completados = fs.filter(completo).length;
        return {
          utm: k,
          iniciados: fs.length,
          vieron_gate: gate,
          completados,
          pct_completa: pct(completados, fs.length),
        };
      })
      .sort((a, b) => b.iniciados - a.iniciados),
  };
}

function resumida(f: FilaWebhook) {
  return {
    codigo: f.id.slice(0, 8).toUpperCase(),
    espacio: f.origen,
    fecha: diaChile(f.fecha_creacion),
    etapa: f.estado_efectivo,
    ruta: f.ruta,
    fase: f.fase,
    score: f.score_numerico,
    problema: textoProblema(f),
    nombre: f.nombre ?? null,
    email: f.email ?? null,
    telefono: f.telefono ?? null,
    utm_campaign: f.utm_campaign,
    utm_content: f.utm_content,
    accion_resultado: f.accion_resultado ?? null,
    texto_libre: f.texto_abierto && f.texto_abierto.length > 280 ? `${f.texto_abierto.slice(0, 280)}…` : f.texto_abierto,
  };
}

function completa(f: FilaWebhook) {
  // Sin los campos propios del envío por webhook.
  const resto: Partial<ReturnType<typeof payloadDeFila>> = payloadDeFila(f, "diagnostico.historico");
  delete resto.evento;
  delete resto.enviado_at;
  return resto;
}

const HERRAMIENTAS_DATOS = [
  herramienta({
    nombre: "listar_espacios",
    titulo: "Espacios, etapas y fases",
    descripcion:
      "Contexto del diagnóstico: los espacios de datos (diagnóstico directo y cada lanzamiento), las etapas del embudo con sus nombres del panel y de Meta, las rutas y las fases. Llamar primero si no conoces los valores de los filtros.",
    esquema: z.object({}),
    ejecutar: async () => ({
      espacios: IDS_ORIGEN.map((id) => ({ id, ...ORIGENES[id] })),
      etapas: ETAPAS.map((id) => ({ id, texto: TEXTO_ETAPA[id] })),
      rutas: (["A", "B", "C"] as const).map((r) => ({ id: r, nombre: NOMBRE_RUTA[r] })),
      fases: FASES.map((f) => ({ id: f, titulo: ROADMAPS[f].parteA.titulo })),
      nota: "Los conteos excluyen las pruebas internas salvo que se pida incluir_pruebas.",
    }),
  }),

  herramienta({
    nombre: "resumen_embudo",
    titulo: "Resumen del embudo",
    descripcion:
      "Embudo por espacio: iniciados → vieron el gate (DiagnosticoIncompleto) → completados (dejaron sus datos, DiagnosticoCompletado), con porcentajes, desglose por etapa, ruta, fase, problema principal, avatar (5+ propiedades), botón tocado en el resultado y WhatsApp.",
    esquema: z.object({
      origen,
      ...rango,
      ruta,
      utm_campaign: z.string().max(200).optional(),
      incluir_pruebas: incluirPruebas,
    }),
    ejecutar: async (a) =>
      porEspacio(
        a.origen,
        { ...a, utmCampaign: a.utm_campaign, incluirPruebas: a.incluir_pruebas },
        embudo
      ),
  }),

  herramienta({
    nombre: "abandono_por_pregunta",
    titulo: "Dónde abandonan",
    descripcion:
      "En qué pregunta se va la gente que no termina el quiz (con el texto de la pregunta), y cuántos abandonan en el gate.",
    esquema: z.object({ origen, ruta, ...rango, incluir_pruebas: incluirPruebas }),
    ejecutar: async (a) => porEspacio(a.origen, { ...a, incluirPruebas: a.incluir_pruebas }, abandonos),
  }),

  herramienta({
    nombre: "resumen_atribucion",
    titulo: "Resultados por UTM",
    descripcion:
      "Iniciados, vieron el gate y completados por combinación de utm_source / medium / campaign / content, para comparar anuncios y campañas.",
    esquema: z.object({ origen, ...rango, incluir_pruebas: incluirPruebas }),
    ejecutar: async (a) => porEspacio(a.origen, { ...a, incluirPruebas: a.incluir_pruebas }, atribucion),
  }),

  herramienta({
    nombre: "listar_diagnosticos",
    titulo: "Listar diagnósticos",
    descripcion:
      "Lista diagnósticos con filtros (espacio, etapa, ruta, fase, fechas, UTM, texto libre). Devuelve una fila resumida por persona con contacto. Con detalle=true devuelve el registro completo con todas las preguntas y respuestas (máximo 30 por página). Pagina con offset.",
    esquema: z.object({
      origen,
      etapa: z.array(z.enum(ETAPAS)).optional().describe("Una o varias etapas."),
      ruta,
      fase: z.enum(FASES as [string, ...string[]]).optional(),
      ...rango,
      utm_campaign: z.string().max(200).optional(),
      utm_content: z.string().max(200).optional(),
      texto: z.string().min(2).max(100).optional().describe("Busca en el texto libre y en el 'otro' del problema."),
      incluir_pruebas: incluirPruebas,
      detalle: z.boolean().optional().describe("Registro completo con respuestas."),
      limite: z.number().int().min(1).max(100).optional().describe("Por defecto 25."),
      offset: z.number().int().min(0).optional(),
    }),
    ejecutar: async (a) => {
      const limite = Math.min(a.limite ?? 25, a.detalle ? 30 : 100);
      const offset = a.offset ?? 0;
      const { filas, total } = await buscarDiagnosticos(
        {
          origen: a.origen,
          etapas: a.etapa as Etapa[] | undefined,
          ruta: a.ruta,
          fase: a.fase,
          desde: a.desde,
          hasta: a.hasta,
          utmCampaign: a.utm_campaign,
          utmContent: a.utm_content,
          texto: a.texto,
          incluirPruebas: a.incluir_pruebas,
        },
        { limite, offset }
      );
      return {
        total,
        offset,
        devueltos: filas.length,
        siguiente_offset: offset + filas.length < total ? offset + filas.length : null,
        diagnosticos: filas.map((f) => (a.detalle ? completa(f) : resumida(f))),
      };
    },
  }),

  herramienta({
    nombre: "ver_diagnostico",
    titulo: "Ver un diagnóstico",
    descripcion:
      "Registro completo de una persona: todas sus preguntas y respuestas, texto libre, fase, oferta, contacto, UTM, fechas y link al resultado. Buscar por código (8 caracteres), email o teléfono.",
    esquema: z
      .object({
        codigo: z.string().regex(/^[0-9A-Za-z-]{4,12}$/).optional().describe("Código de 8 caracteres que ve la persona."),
        email: z.string().max(200).optional(),
        telefono: z.string().max(30).optional(),
        incluir_pruebas: incluirPruebas,
      })
      .refine((a) => a.codigo || a.email || a.telefono, "Indica codigo, email o telefono."),
    ejecutar: async (a) => {
      const { filas, total } = await buscarDiagnosticos(
        { codigo: a.codigo, email: a.email, telefono: a.telefono, incluirPruebas: a.incluir_pruebas ?? true },
        { limite: 10 }
      );
      if (total === 0) return { encontrados: 0, mensaje: "No hay diagnósticos con esos datos." };
      return {
        encontrados: total,
        diagnosticos: filas.map((f) => ({
          espacio_nombre: datosDeOrigen(f.origen).nombre,
          etapa_texto: TEXTO_ETAPA[f.estado_efectivo as Etapa] ?? f.estado_efectivo,
          ...completa(f),
        })),
      };
    },
  }),
];

export const HERRAMIENTAS = [
  ...HERRAMIENTAS_DATOS,
  ...HERRAMIENTAS_ANALISIS,
  ...HERRAMIENTAS_CONTENIDO,
  ...HERRAMIENTAS_GHL,
];

export type HerramientaMcp = (typeof HERRAMIENTAS)[number];

/** Definiciones para `tools/list`. */
export function definicionesHerramientas() {
  return HERRAMIENTAS.map((h) => {
    const inputSchema = z.toJSONSchema(h.esquema, { io: "input" }) as Record<string, unknown>;
    delete inputSchema.$schema;
    return {
      name: h.nombre,
      title: h.titulo,
      description: h.descripcion,
      inputSchema: { type: "object", ...inputSchema },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    };
  });
}

export async function ejecutarHerramienta(
  nombre: string,
  args: unknown
): Promise<{ ok: true; resultado: unknown } | { ok: false; error: string }> {
  const h = HERRAMIENTAS.find((x) => x.nombre === nombre);
  if (!h) return { ok: false, error: `Herramienta desconocida: ${nombre}` };
  const parsed = h.esquema.safeParse(args ?? {});
  if (!parsed.success) {
    return { ok: false, error: `Argumentos inválidos: ${z.prettifyError(parsed.error)}` };
  }
  try {
    // El tipo exacto de cada herramienta ya lo garantizó safeParse.
    const resultado = await (h.ejecutar as (a: unknown) => Promise<unknown>)(parsed.data);
    return { ok: true, resultado };
  } catch (err) {
    console.error(`[mcp] Error en ${nombre}:`, err);
    return { ok: false, error: err instanceof Error ? err.message : "Error inesperado" };
  }
}
