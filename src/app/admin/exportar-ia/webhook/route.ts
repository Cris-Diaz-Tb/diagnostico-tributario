import { NextResponse } from "next/server";
import { esAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { espacioActivo } from "@/lib/espacio-admin";
import { inicioDelDiaChile } from "@/lib/hora-chile";
import { enviarFilasWebhook, urlWebhookDatos, type FilaWebhook } from "@/lib/webhook-datos";

/**
 * Reenvía al webhook de datos los diagnósticos que ya existen del espacio
 * que se está mirando, con `evento: "diagnostico.historico"`. Sirve para
 * la carga inicial y para recuperar lo que no llegó si el flujo estuvo caído.
 *
 * Formulario POST desde /admin/exportar-ia: desde (opcional) y pruebas=1.
 */

export const maxDuration = 300;

const POR_LOTE = 1000;
const MAXIMO = 10000;

function volver(request: Request, params: Record<string, string>) {
  const url = new URL("/admin/exportar-ia", request.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = await urlWebhookDatos();
  if (!url) return volver(request, { webhook: "sin_url" });

  const supabase = getSupabase();
  if (!supabase) return volver(request, { webhook: "sin_bd" });

  const form = await request.formData();
  const desdeParam = String(form.get("desde") ?? "");
  const desde = /^\d{4}-\d{2}-\d{2}$/.test(desdeParam) ? inicioDelDiaChile(desdeParam) : null;
  const incluirPruebas = form.get("pruebas") === "1";
  const espacio = await espacioActivo();

  // PostgREST corta cada respuesta en 1000 filas: se pagina.
  const filas: FilaWebhook[] = [];
  for (let inicio = 0; inicio < MAXIMO; inicio += POR_LOTE) {
    let consulta = supabase
      .from("diagnosticos_embudo")
      .select("*")
      .eq("origen", espacio)
      .order("fecha_creacion", { ascending: true })
      .range(inicio, inicio + POR_LOTE - 1);
    if (desde) consulta = consulta.gte("fecha_creacion", desde);
    if (!incluirPruebas) consulta = consulta.eq("es_prueba", false);

    const { data, error } = await consulta;
    if (error) {
      console.error("[admin/exportar-ia/webhook] Error consultando:", error);
      return volver(request, { webhook: "error" });
    }
    const lote = (data ?? []) as FilaWebhook[];
    filas.push(...lote);
    if (lote.length < POR_LOTE) break;
  }

  const { enviados, fallidos } = await enviarFilasWebhook(url, filas, "diagnostico.historico");
  return volver(request, {
    webhook: fallidos === 0 ? "ok" : "parcial",
    enviados: String(enviados),
    fallidos: String(fallidos),
  });
}
