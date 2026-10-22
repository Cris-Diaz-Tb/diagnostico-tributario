import "server-only";
import { getSupabase } from "@/lib/supabase";
import { diagnosticosDemo } from "@/lib/demo-data";
import { inicioDelDiaChile } from "@/lib/hora-chile";
import { IDS_ORIGEN, type OrigenId } from "@/content/origenes";
import type { FilaWebhook } from "@/lib/webhook-datos";

/**
 * Lectura de diagnósticos para el MCP. SOLO lectura: aquí no hay ningún
 * insert, update ni delete. Lee la vista `diagnosticos_embudo` (la misma del
 * panel); sin Supabase usa el dataset demo, para probar en local.
 */

export const ETAPAS = ["en_curso", "abandono_preguntas", "abandono_gate", "capturado"] as const;
export type Etapa = (typeof ETAPAS)[number];

/** Nombres del panel y de Meta para cada etapa. */
export const TEXTO_ETAPA: Record<Etapa, string> = {
  en_curso: "En curso (activo en los últimos 30 min)",
  abandono_preguntas: "Abandonó en las preguntas",
  abandono_gate: "Vio el gate y no dejó sus datos (DiagnosticoIncompleto)",
  capturado: "Completado: dejó sus datos y vio su diagnóstico (DiagnosticoCompletado)",
};

export interface Filtros {
  origen?: OrigenId;
  etapas?: Etapa[];
  ruta?: "A" | "B" | "C";
  fase?: string;
  /** Días en Chile, YYYY-MM-DD, ambos inclusive. */
  desde?: string;
  hasta?: string;
  utmCampaign?: string;
  utmContent?: string;
  /** Busca en el texto libre y en el "otro" del problema. */
  texto?: string;
  incluirPruebas?: boolean;
  codigo?: string;
  email?: string;
  telefono?: string;
}

export const MAXIMO_FILAS = 10000;
const POR_LOTE = 1000;

function diaSiguiente(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const codigoDe = (id: string) => id.slice(0, 8).toUpperCase();
const soloDigitos = (s: string) => s.replace(/\D/g, "");
/** Quita lo que rompería un filtro de PostgREST (comas, paréntesis, comodines). */
const limpiar = (s: string) => s.replace(/[,()*%_\\]/g, " ").trim();

function cumple(f: FilaWebhook, filtros: Filtros): boolean {
  const ini = filtros.desde ? new Date(inicioDelDiaChile(filtros.desde)) : null;
  const fin = filtros.hasta ? new Date(inicioDelDiaChile(diaSiguiente(filtros.hasta))) : null;
  const fecha = new Date(f.fecha_creacion);
  const texto = filtros.texto?.toLowerCase();
  return (
    (!filtros.origen || f.origen === filtros.origen) &&
    (!filtros.etapas?.length || filtros.etapas.includes(f.estado_efectivo as Etapa)) &&
    (!filtros.ruta || f.ruta === filtros.ruta) &&
    (!filtros.fase || f.fase === filtros.fase) &&
    (!ini || fecha >= ini) &&
    (!fin || fecha < fin) &&
    (!filtros.utmCampaign || f.utm_campaign === filtros.utmCampaign) &&
    (!filtros.utmContent || f.utm_content === filtros.utmContent) &&
    (!texto ||
      Boolean(f.texto_abierto?.toLowerCase().includes(texto)) ||
      Boolean(f.problema_otro?.toLowerCase().includes(texto))) &&
    (filtros.incluirPruebas || !f.es_prueba) &&
    (!filtros.codigo || codigoDe(f.id) === filtros.codigo.toUpperCase()) &&
    (!filtros.email || f.email?.toLowerCase() === filtros.email.toLowerCase()) &&
    (!filtros.telefono ||
      soloDigitos(f.telefono ?? "").endsWith(soloDigitos(filtros.telefono).slice(-8)))
  );
}

function filasDemo(): FilaWebhook[] {
  return IDS_ORIGEN.flatMap((o) => diagnosticosDemo(o)).map((d) => ({
    ...d,
    token_resultado: `demo-${d.fase ?? "A1"}`,
    es_prueba: false,
  })) as unknown as FilaWebhook[];
}

export interface Pagina {
  filas: FilaWebhook[];
  /** Total que cumple los filtros (puede ser más que las filas devueltas). */
  total: number;
}

/**
 * Diagnósticos que cumplen los filtros, más recientes primero.
 * `limite` acota lo que se devuelve; `total` cuenta todos.
 */
export async function buscarDiagnosticos(
  filtros: Filtros,
  { limite = MAXIMO_FILAS, offset = 0 }: { limite?: number; offset?: number } = {}
): Promise<Pagina> {
  const supabase = getSupabase();

  if (!supabase) {
    const todas = filasDemo()
      .filter((f) => cumple(f, filtros))
      .sort((a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion));
    return { filas: todas.slice(offset, offset + limite), total: todas.length };
  }

  const filas: FilaWebhook[] = [];
  let total = 0;
  const tope = Math.min(limite, MAXIMO_FILAS);

  for (let inicio = offset; inicio < offset + tope; inicio += POR_LOTE) {
    const finLote = Math.min(inicio + POR_LOTE, offset + tope) - 1;
    let q = supabase
      .from("diagnosticos_embudo")
      .select("*", { count: "exact" })
      .order("fecha_creacion", { ascending: false })
      .range(inicio, finLote);

    if (filtros.origen) q = q.eq("origen", filtros.origen);
    if (filtros.etapas?.length) q = q.in("estado_efectivo", filtros.etapas);
    if (filtros.ruta) q = q.eq("ruta", filtros.ruta);
    if (filtros.fase) q = q.eq("fase", filtros.fase);
    if (filtros.desde) q = q.gte("fecha_creacion", inicioDelDiaChile(filtros.desde));
    if (filtros.hasta) q = q.lt("fecha_creacion", inicioDelDiaChile(diaSiguiente(filtros.hasta)));
    if (filtros.utmCampaign) q = q.eq("utm_campaign", filtros.utmCampaign);
    if (filtros.utmContent) q = q.eq("utm_content", filtros.utmContent);
    if (!filtros.incluirPruebas) q = q.eq("es_prueba", false);
    if (filtros.codigo) q = q.eq("codigo", filtros.codigo.toUpperCase());
    // Igualdad sin mayúsculas: se escapan los comodines de LIKE (un "_"
    // en el email es literal).
    if (filtros.email) q = q.ilike("email", filtros.email.trim().replace(/[\\%_]/g, "\\$&"));
    if (filtros.telefono) {
      const digitos = soloDigitos(filtros.telefono).slice(-8);
      if (digitos) q = q.ilike("telefono", `%${digitos.split("").join("%")}%`);
    }
    if (filtros.texto) {
      const t = limpiar(filtros.texto);
      if (t) q = q.or(`texto_abierto.ilike.*${t}*,problema_otro.ilike.*${t}*`);
    }

    const { data, error, count } = await q;
    if (error) throw new Error(`Error consultando diagnósticos: ${error.message}`);
    const lote = (data ?? []) as FilaWebhook[];
    filas.push(...lote);
    total = count ?? filas.length;
    if (lote.length < finLote - inicio + 1) break;
  }

  return { filas, total };
}
