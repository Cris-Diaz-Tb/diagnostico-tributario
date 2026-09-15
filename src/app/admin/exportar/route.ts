import { NextResponse } from "next/server";
import { esAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import type { RespuestaDetallada } from "@/lib/scoring";

/**
 * Exportación CSV de los diagnósticos.
 *
 * El análisis de los textos abiertos se hace fuera de la plataforma, así
 * que esto es la salida principal de la fase de investigación. Incluye
 * las respuestas de etiqueta, el texto libre y la atribución completa.
 */

const COLUMNAS = [
  "id",
  "fecha",
  "estado",
  "nombre",
  "email",
  "telefono",
  "ruta",
  "fase",
  "score",
  "version_cuestionario",
  "oferta_recomendada",
  "problema_principal",
  "problema_otro",
  "nivel_intencion",
  "texto_abierto",
  "preguntas_respondidas",
  "total_preguntas",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "referrer",
  "respuestas",
] as const;

/**
 * Escapa un valor para CSV. Además neutraliza la inyección de fórmulas:
 * un texto abierto que empiece por = + - @ se ejecutaría como fórmula al
 * abrir el archivo en Excel o Sheets.
 */
function celda(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  let texto = String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replaceAll('"', '""')}"`;
}

/** Aplana el detalle de respuestas a "pregunta: opción | pregunta: opción". */
function resumirRespuestas(respuestas: unknown): string {
  if (!Array.isArray(respuestas)) return "";
  return (respuestas as RespuestaDetallada[])
    .map((r) => `${r.preguntaId}: ${r.opcion}`)
    .join(" | ");
}

export async function GET(request: Request) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 });
  }

  const filtroRuta = new URL(request.url).searchParams.get("ruta");

  let consulta = supabase
    .from("diagnosticos_embudo")
    .select("*")
    .order("fecha_creacion", { ascending: false })
    .limit(5000);

  if (filtroRuta === "A" || filtroRuta === "B" || filtroRuta === "C") {
    consulta = consulta.eq("ruta", filtroRuta);
  }

  const { data, error } = await consulta;
  if (error) {
    console.error("[admin/exportar] Error consultando:", error);
    return NextResponse.json({ error: "Error exportando" }, { status: 500 });
  }

  const filas = (data ?? []).map((d) =>
    [
      d.id,
      d.fecha_creacion,
      d.estado_efectivo,
      d.nombre,
      d.email,
      d.telefono,
      d.ruta,
      d.fase,
      d.score_numerico,
      d.version_cuestionario,
      d.oferta_recomendada,
      d.problema_principal,
      d.problema_otro,
      d.nivel_intencion,
      d.texto_abierto,
      d.preguntas_respondidas,
      d.total_preguntas,
      d.utm_source,
      d.utm_medium,
      d.utm_campaign,
      d.utm_content,
      d.utm_term,
      d.referrer,
      resumirRespuestas(d.respuestas),
    ]
      .map(celda)
      .join(",")
  );

  // BOM para que Excel abra los acentos correctamente.
  const csv = ["﻿" + COLUMNAS.join(","), ...filas].join("\r\n");
  const fecha = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="diagnosticos-${fecha}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
