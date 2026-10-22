import "server-only";
import { z } from "zod";
import { COPY } from "@/content/copy";
import { OFERTAS, ofertaDeRoadmap } from "@/content/ofertas";
import {
  NOMBRE_RUTA,
  PREGUNTA_BIFURCACION,
  RUTAS,
  TEXTO_PROBLEMA,
  VERSION_CUESTIONARIO,
  preguntasDeRuta,
} from "@/content/preguntas";
import { FASES, ROADMAPS, ctaEfectivo } from "@/content/roadmaps";
import type { FaseId, OfertaId, Ruta } from "@/content/tipos";
import { UMBRALES } from "@/lib/scoring";
import { herramienta } from "./comun";

/**
 * Contexto del quiz: lo que la persona ve y cómo se calcula su resultado.
 * Sale directo de src/content, así que siempre coincide con lo publicado.
 */

const ruta = z.enum(["A", "B", "C"]).optional().describe("Vacío = las tres rutas.");

function cuestionarioDeRuta(r: Ruta) {
  const preguntas = preguntasDeRuta(r);
  const umbrales = UMBRALES[r];
  return {
    ruta: r,
    nombre: NOMBRE_RUTA[r],
    total_preguntas: preguntas.length,
    preguntas: preguntas.map((p, i) => ({
      numero: i + 1,
      id: p.id,
      tipo: p.tipo,
      texto: p.texto,
      ...("ayuda" in p && p.ayuda ? { ayuda: p.ayuda } : {}),
      ...(p.tipo === "tag" ? { guarda_en: p.campo } : {}),
      ...(p.tipo === "abierta" ? { opcional: true, max_caracteres: p.maxLargo } : {}),
      ...(p.tipo !== "abierta"
        ? {
            opciones: p.opciones.map((o) => ({
              id: o.id,
              texto: o.texto,
              ...("puntos" in o ? { puntos: o.puntos } : {}),
              ...("requiereDetalle" in o && o.requiereDetalle ? { pide_detalle: true } : {}),
            })),
          }
        : {}),
    })),
    fases: umbrales.map((u, i) => ({
      fase: u.fase,
      titulo: ROADMAPS[u.fase].parteA.titulo,
      score_desde: i === 0 ? null : umbrales[i - 1].hasta + 1,
      score_hasta: u.hasta,
    })),
  };
}

function roadmap(fase: FaseId) {
  const r = ROADMAPS[fase];
  const nombreOferta = (id: OfertaId) => OFERTAS[id].nombre;
  return {
    fase,
    estado_del_texto: r.status,
    antes_del_gate: { titulo: r.parteA.titulo, diagnostico: r.parteA.diagnostico },
    despues_del_gate: {
      pasos: r.parteB.pasos,
      cta: r.parteB.cta,
      cta_por_problema: Object.fromEntries(
        Object.entries(r.parteB.ctaPorTag ?? {}).map(([tag, cta]) => [TEXTO_PROBLEMA[tag] ?? tag, cta])
      ),
    },
    oferta_por_defecto: nombreOferta(r.oferta),
    oferta_por_problema: Object.fromEntries(
      Object.keys(TEXTO_PROBLEMA).map((tag) => [TEXTO_PROBLEMA[tag], ofertaDeRoadmap(r, tag).nombre])
    ),
    cta_efectivo_por_problema: Object.fromEntries(
      Object.keys(TEXTO_PROBLEMA).map((tag) => [TEXTO_PROBLEMA[tag], ctaEfectivo(r, tag)])
    ),
  };
}

/** Pasa el copy a JSON: los textos dinámicos (funciones) salen con un ejemplo. */
function serializable(valor: unknown): unknown {
  if (typeof valor === "function") {
    try {
      const ejemplo = (valor as (...a: unknown[]) => unknown)(2, 9);
      return `[texto dinámico, ej.: ${String(ejemplo)}]`;
    } catch {
      return "[texto dinámico]";
    }
  }
  if (Array.isArray(valor)) return valor.map(serializable);
  if (valor && typeof valor === "object") {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, serializable(v)]));
  }
  return valor;
}

const SECCIONES_COPY = Object.keys(COPY) as (keyof typeof COPY)[];

const DONDE_SE_VE: Partial<Record<keyof typeof COPY, string>> = {
  landing: "Portada del diagnóstico directo (/)",
  lanzamiento: "Portada del lanzamiento (/brecha-estructural) y botón del resultado del lanzamiento",
  landingEtapas: "Landing larga para tráfico frío (/descubre)",
  quiz: "Durante las preguntas y la pantalla de análisis",
  gate: "El gate: preview de la fase y formulario de datos",
  resultado: "Página de resultado completo",
  webinar: "Botón del webinar en el resultado",
  whatsapp: "Botón y mensaje de WhatsApp",
  email: "Correo con el diagnóstico",
};

export const HERRAMIENTAS_CONTENIDO = [
  herramienta({
    nombre: "ver_cuestionario",
    titulo: "Cuestionario y puntajes",
    descripcion:
      "Las preguntas de cada ruta tal como las ve la persona, con sus opciones, los puntos de cada opción, las preguntas de clasificación (problema, intención), la abierta, y los rangos de score de cada fase. Úsala para interpretar respuestas o proponer cambios al quiz.",
    esquema: z.object({ ruta }),
    ejecutar: async (a) => ({
      version_cuestionario: VERSION_CUESTIONARIO,
      bifurcacion: {
        texto: PREGUNTA_BIFURCACION.texto,
        ayuda: PREGUNTA_BIFURCACION.ayuda,
        opciones: PREGUNTA_BIFURCACION.opciones.map((o) => ({
          id: o.id,
          texto: o.texto,
          lleva_a_ruta: o.ruta,
          avatar: o.avatar,
        })),
        nota: "El avatar de Cris es quien tiene 5 propiedades o más.",
      },
      rutas: (a.ruta ? [a.ruta] : RUTAS).map(cuestionarioDeRuta),
      score: "Suma de los puntos de las preguntas puntuadas. Las de clasificación y la abierta no puntúan.",
    }),
  }),

  herramienta({
    nombre: "ver_roadmaps",
    titulo: "Qué ve cada fase",
    descripcion:
      "Lo que muestra el resultado de cada fase: el preview antes del gate (título y diagnóstico), los 3 pasos y el CTA después de dejar los datos, y qué oferta y CTA le tocan según su problema principal.",
    esquema: z.object({ fase: z.enum(FASES as [FaseId, ...FaseId[]]).optional().describe("Vacío = todas.") }),
    ejecutar: async (a) => ({ fases: (a.fase ? [a.fase] : FASES).map(roadmap) }),
  }),

  herramienta({
    nombre: "ver_ofertas",
    titulo: "Servicios y precios",
    descripcion:
      "Catálogo de servicios de Cris con su precio INTERNO en CLP (nunca se muestra en el sitio) y las reglas para recomendar cada uno.",
    esquema: z.object({}),
    ejecutar: async () => ({
      ofertas: Object.values(OFERTAS).map((o) => ({
        id: o.id,
        nombre: o.nombre,
        para_quien: o.paraQuien,
        precio_interno_clp: o.precioInternoClp,
      })),
      reglas: [
        "Quien marca que el SII lo notificó (o teme que lo haga) recibe siempre la regularización, sin importar su fase.",
        "Si no, se usa la oferta específica de su fase para su problema; si no hay, la oferta por defecto de la fase (ver ver_roadmaps).",
        "El precio no aparece en el diagnóstico, el resultado ni el correo: es para el equipo comercial y el CRM.",
      ],
    }),
  }),

  herramienta({
    nombre: "ver_textos_del_sitio",
    titulo: "Textos del sitio",
    descripcion:
      "El copy publicado: portadas (directo y lanzamiento), textos del quiz, el gate, el resultado, el correo y WhatsApp. Úsala para proponer cambios concretos donde se va la gente. Sin sección devuelve el índice.",
    esquema: z.object({
      seccion: z
        .enum(SECCIONES_COPY as [string, ...string[]])
        .optional()
        .describe("Una sección. Vacío = lista de secciones y dónde se ve cada una."),
    }),
    ejecutar: async (a) => {
      if (!a.seccion) {
        return {
          secciones: SECCIONES_COPY.map((s) => ({ seccion: s, donde_se_ve: DONDE_SE_VE[s] ?? null })),
          nota: "Los textos de cada fase del resultado están en ver_roadmaps.",
        };
      }
      const clave = a.seccion as keyof typeof COPY;
      return { seccion: clave, donde_se_ve: DONDE_SE_VE[clave] ?? null, textos: serializable(COPY[clave]) };
    },
  }),
];
