import "server-only";
import { z } from "zod";
import { datosDeOrigen } from "@/content/origenes";
import type { FilaWebhook } from "@/lib/webhook-datos";
import {
  DIMENSIONES,
  completo,
  contar,
  embudo,
  esquemaDia,
  esquemaDimension,
  esquemaOrigen,
  esquemaPruebas,
  esquemaRango,
  esquemaRuta,
  herramienta,
  pct,
  valorDimension,
  vioGate,
} from "./comun";
import { ETAPAS, buscarDiagnosticos, type Etapa } from "./datos";

/** Cruces y comparaciones sobre los diagnósticos. Solo lectura. */

const MAX_FILAS_CRUCE = 40;

export function cruzar(filas: FilaWebhook[], filasDim: string, columnasDim?: string) {
  const grupos = new Map<string, FilaWebhook[]>();
  for (const f of filas) {
    const k = valorDimension(f, filasDim) ?? "(sin dato)";
    grupos.set(k, [...(grupos.get(k) ?? []), f]);
  }

  const columnas = columnasDim
    ? Object.keys(contar(filas, (f) => valorDimension(f, columnasDim)))
    : null;

  const ordenadas = [...grupos.entries()].sort((a, b) =>
    filasDim === "dia" || filasDim === "semana" ? a[0].localeCompare(b[0]) : b[1].length - a[1].length
  );

  const resultado = ordenadas.slice(0, MAX_FILAS_CRUCE).map(([valor, fs]) => {
    const base = {
      [filasDim]: valor,
      total: fs.length,
      vieron_gate: fs.filter(vioGate).length,
      completados: fs.filter(completo).length,
      pct_completa: pct(fs.filter(completo).length, fs.length),
    };
    if (!columnas || !columnasDim) return base;
    const porColumna = contar(fs, (f) => valorDimension(f, columnasDim));
    return {
      ...base,
      [columnasDim]: Object.fromEntries(
        columnas.map((c) => [c, { n: porColumna[c] ?? 0, pct_fila: pct(porColumna[c] ?? 0, fs.length) }])
      ),
    };
  });

  return {
    total: filas.length,
    filas_por: filasDim,
    columnas_por: columnasDim ?? null,
    ...(ordenadas.length > MAX_FILAS_CRUCE
      ? { aviso: `Se muestran las ${MAX_FILAS_CRUCE} filas con más diagnósticos de ${ordenadas.length}.` }
      : {}),
    filas: resultado,
  };
}

const METRICAS_COMPARABLES = [
  "iniciados",
  "vieron_gate",
  "completados",
  "pct_llega_al_gate",
  "pct_completa_desde_gate",
  "pct_completa_de_iniciados",
  "score_promedio",
  "avatar_5_o_mas",
  "escribieron_por_whatsapp",
] as const;

const periodo = z.object({
  origen: esquemaOrigen,
  desde: esquemaDia,
  hasta: esquemaDia,
  etiqueta: z.string().max(60).optional().describe("Nombre para mostrar, ej. 'semana 1'."),
});

export const HERRAMIENTAS_ANALISIS = [
  herramienta({
    nombre: "cruzar",
    titulo: "Cruzar dos variables",
    descripcion: `Tabla de diagnósticos agrupados por una variable (filas) y opcionalmente cruzados con otra (columnas), con total, vieron el gate, completados y % que completa por fila. Ej.: filas=utm_content columnas=etapa; filas=problema columnas=completo; filas=respuesta:b3 columnas=fase; filas=dia para la serie diaria. Variables: ${DIMENSIONES.join(", ")}, o respuesta:<id de pregunta>.`,
    esquema: z.object({
      filas: esquemaDimension.describe("Variable de las filas."),
      columnas: esquemaDimension.optional().describe("Variable de las columnas (opcional)."),
      origen: esquemaOrigen,
      etapa: z.array(z.enum(ETAPAS)).optional().describe("Solo estas etapas."),
      ruta: esquemaRuta,
      ...esquemaRango,
      incluir_pruebas: esquemaPruebas,
    }),
    ejecutar: async (a) => {
      const { filas, total } = await buscarDiagnosticos({
        origen: a.origen,
        etapas: a.etapa as Etapa[] | undefined,
        ruta: a.ruta,
        desde: a.desde,
        hasta: a.hasta,
        incluirPruebas: a.incluir_pruebas,
      });
      return {
        ...(total > filas.length ? { aviso_muestra: `Solo se analizaron ${filas.length} de ${total}.` } : {}),
        ...cruzar(filas, a.filas, a.columnas),
      };
    },
  }),

  herramienta({
    nombre: "comparar_periodos",
    titulo: "Comparar dos periodos o espacios",
    descripcion:
      "Compara el embudo de dos grupos (A y B): dos rangos de fechas, o el mismo rango en dos espacios (ej. lanzamiento contra directo). Devuelve las métricas de cada uno, la diferencia y el problema principal de cada grupo.",
    esquema: z.object({
      a: periodo.describe("Grupo A."),
      b: periodo.describe("Grupo B."),
      ruta: esquemaRuta,
      incluir_pruebas: esquemaPruebas,
    }),
    ejecutar: async (x) => {
      const leer = (p: z.infer<typeof periodo>) =>
        buscarDiagnosticos({
          origen: p.origen,
          desde: p.desde,
          hasta: p.hasta,
          ruta: x.ruta,
          incluirPruebas: x.incluir_pruebas,
        });
      const [ra, rb] = await Promise.all([leer(x.a), leer(x.b)]);
      const ea = embudo(ra.filas);
      const eb = embudo(rb.filas);
      const nombre = (p: z.infer<typeof periodo>) =>
        p.etiqueta ?? `${p.origen ? datosDeOrigen(p.origen).nombre : "Todos los espacios"} · ${p.desde} a ${p.hasta}`;

      return {
        a: nombre(x.a),
        b: nombre(x.b),
        metricas: Object.fromEntries(
          METRICAS_COMPARABLES.map((m) => {
            const va = ea[m] ?? 0;
            const vb = eb[m] ?? 0;
            return [
              m,
              {
                a: ea[m],
                b: eb[m],
                diferencia_b_menos_a: Math.round((vb - va) * 10) / 10,
                ...(m.startsWith("pct_") ? {} : { variacion_pct: va ? pct(vb - va, va) : null }),
              },
            ];
          })
        ),
        por_ruta: { a: ea.por_ruta, b: eb.por_ruta },
        problema_principal: { a: ea.problema_principal, b: eb.problema_principal },
        nota: "Las diferencias de % son en puntos porcentuales.",
      };
    },
  }),
];
