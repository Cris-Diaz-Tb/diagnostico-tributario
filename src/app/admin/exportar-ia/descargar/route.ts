import { NextResponse } from "next/server";
import { esAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { DIAGNOSTICOS_DEMO } from "@/lib/demo-data";
import { RUTAS } from "@/content/preguntas";
import type { Ruta } from "@/content/tipos";
import {
  COLUMNAS_IA,
  SEGMENTOS_IA,
  exportarJsonl,
  exportarMarkdown,
  type FilaIA,
  type SegmentoIA,
} from "@/lib/exportacion-ia";

/**
 * Descarga de /admin/exportar-ia. Recibe el formulario por GET:
 * segmento (repetible), ruta, desde, formato (md | jsonl), contacto=1 y
 * pruebas=1 (sin él, las pruebas internas quedan fuera).
 */

// PostgREST corta cada respuesta en 1000 filas, así que se pagina.
const POR_LOTE = 1000;
const MAXIMO = 10000;

export async function GET(request: Request) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const pedidos = params.getAll("segmento").filter((s): s is SegmentoIA =>
    SEGMENTOS_IA.includes(s as SegmentoIA)
  );
  const segmentos = pedidos.length > 0 ? pedidos : [...SEGMENTOS_IA];
  const rutaParam = params.get("ruta");
  const ruta = RUTAS.includes(rutaParam as Ruta) ? (rutaParam as Ruta) : null;
  const desdeParam = params.get("desde");
  const desde = desdeParam && /^\d{4}-\d{2}-\d{2}$/.test(desdeParam) ? desdeParam : null;
  const formato = params.get("formato") === "jsonl" ? "jsonl" : "md";
  const incluirContacto = params.get("contacto") === "1";
  const incluirPruebas = params.get("pruebas") === "1";

  const supabase = getSupabase();
  let filas: FilaIA[];

  if (supabase) {
    filas = [];
    for (let inicio = 0; inicio < MAXIMO; inicio += POR_LOTE) {
      let consulta = supabase
        .from("diagnosticos_embudo")
        .select(COLUMNAS_IA)
        .in("estado_efectivo", segmentos)
        .order("fecha_creacion", { ascending: false })
        .range(inicio, inicio + POR_LOTE - 1);
      if (ruta) consulta = consulta.eq("ruta", ruta);
      if (desde) consulta = consulta.gte("fecha_creacion", desde);
      if (!incluirPruebas) consulta = consulta.eq("es_prueba", false);

      const { data, error } = await consulta;
      if (error) {
        console.error("[admin/exportar-ia] Error consultando:", error);
        return NextResponse.json({ error: "Error exportando" }, { status: 500 });
      }
      const lote = (data ?? []) as unknown as FilaIA[];
      filas.push(...lote);
      if (lote.length < POR_LOTE) break;
    }
  } else {
    filas = DIAGNOSTICOS_DEMO.filter(
      (d) =>
        segmentos.includes(d.estado_efectivo as SegmentoIA) &&
        (!ruta || d.ruta === ruta) &&
        (!desde || d.fecha_creacion >= desde)
    );
  }

  const fecha = new Date().toISOString().slice(0, 10);
  const cuerpo =
    formato === "jsonl"
      ? exportarJsonl(filas, incluirContacto)
      : exportarMarkdown(filas, incluirContacto);

  return new NextResponse(cuerpo, {
    headers: {
      "Content-Type":
        formato === "jsonl"
          ? "application/x-ndjson; charset=utf-8"
          : "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="respuestas-ia-${fecha}.${formato}"`,
      "Cache-Control": "no-store",
    },
  });
}
