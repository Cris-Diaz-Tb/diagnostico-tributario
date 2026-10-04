import { redirect } from "next/navigation";
import type { Viewport } from "next";
import { esAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { espacioActivo } from "@/lib/espacio-admin";
import {
  diagnosticosDemo,
  abandonoPorPreguntaDemo,
  type EstadoEfectivo,
} from "@/lib/demo-data";
import { esAvatar, preguntasDeRuta, respuestaBifurcacion, RUTAS } from "@/content/preguntas";
import { faseEstimadaDeDetalle, type RespuestaDetallada } from "@/lib/scoring";
import { Barra, BotonPrueba, COLOR_FASE, Contador, Filtro, Marco, fechaCorta, porcentaje } from "../ui";
import type { FaseId, Ruta } from "@/content/tipos";

export const metadata = { title: "Abandonos | Cris. Tributario" };
export const viewport: Viewport = { themeColor: "#0A0F16" };
export const dynamic = "force-dynamic";

const POR_PAGINA = 25;

interface FilaAbandonoPregunta {
  ruta: Ruta;
  pregunta_id: string;
  preguntas_respondidas: number;
  abandonos: number;
}

type Vista = "abandonos" | "completados";

const ESTADOS_DE_VISTA: Record<Vista, EstadoEfectivo[]> = {
  abandonos: ["abandono_preguntas", "abandono_gate"],
  completados: ["capturado"],
};

interface FilaAbandono {
  id: string;
  nombre: string | null;
  email: string | null;
  fecha_creacion: string;
  ultima_actividad_at: string;
  ruta: Ruta;
  estado_efectivo: EstadoEfectivo;
  preguntas_respondidas: number;
  total_preguntas: number | null;
  ultima_pregunta_id: string | null;
  respuestas: RespuestaDetallada[];
  fase: FaseId | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term?: string | null;
  es_prueba?: boolean;
  propiedades_rango?: string | null;
}

export default async function PanelAbandonos({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string; ruta?: string; vista?: string }>;
}) {
  if (!(await esAdmin())) redirect("/admin/login");

  const params = await searchParams;
  const pagina = Math.max(1, parseInt(params.pagina ?? "1", 10) || 1);
  const filtroRuta = RUTAS.includes(params.ruta as Ruta) ? (params.ruta as Ruta) : null;
  const vista: Vista = params.vista === "completados" ? "completados" : "abandonos";
  const estados = ESTADOS_DE_VISTA[vista];

  const espacio = await espacioActivo();
  const supabase = getSupabase();
  const usandoDemo = !supabase;

  let porPregunta: FilaAbandonoPregunta[];
  let filas: FilaAbandono[];
  let total: number;

  if (supabase) {
    const { data: histograma } = await supabase
      .from("abandono_por_pregunta")
      .select("*")
      .eq("origen", espacio);
    porPregunta = (histograma ?? []) as FilaAbandonoPregunta[];

    let consulta = supabase
      .from("diagnosticos_embudo")
      .select(
        "id, nombre, email, fecha_creacion, ultima_actividad_at, ruta, estado_efectivo, preguntas_respondidas, total_preguntas, ultima_pregunta_id, respuestas, fase, utm_source, utm_campaign, utm_content, utm_term, es_prueba, propiedades_rango",
        { count: "exact" }
      )
      .in("estado_efectivo", estados)
      .eq("origen", espacio)
      .order("ultima_actividad_at", { ascending: false })
      .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

    if (filtroRuta) consulta = consulta.eq("ruta", filtroRuta);

    const { data, count } = await consulta;
    filas = (data ?? []) as FilaAbandono[];
    total = count ?? 0;
  } else {
    const delEspacio = diagnosticosDemo(espacio);
    porPregunta = abandonoPorPreguntaDemo(delEspacio);
    const todas = delEspacio.filter(
      (d) =>
        estados.includes(d.estado_efectivo) &&
        (!filtroRuta || d.ruta === filtroRuta)
    );
    total = todas.length;
    filas = todas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  }

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const rutasAMostrar: Ruta[] = filtroRuta ? [filtroRuta] : RUTAS;

  const urlCon = (cambios: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const estado: Record<string, string | null> = {
      ruta: filtroRuta,
      vista: vista === "completados" ? vista : null,
      pagina: null,
      ...cambios,
    };
    for (const [k, v] of Object.entries(estado)) if (v) p.set(k, v);
    const qs = p.toString();
    return qs ? `/admin/abandonos?${qs}` : "/admin/abandonos";
  };

  const enQuiz = filas.filter((f) => f.estado_efectivo === "abandono_preguntas").length;
  const totalAbandonosHistograma = porPregunta.reduce(
    (s, p) => s + Number(p.abandonos),
    0
  );

  return (
    <Marco usandoDemo={usandoDemo} activa="/admin/abandonos">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Contador
          etiqueta={vista === "completados" ? "Completados totales" : "Abandonos totales"}
          valor={String(total)}
          matiz={vista === "completados" ? "bueno" : "alerta"}
        />
        <Contador
          etiqueta="Se cayeron en el quiz"
          valor={String(totalAbandonosHistograma)}
          nota="no llegaron a ver su fase"
        />
        {vista === "abandonos" && (
          <Contador
            etiqueta="En esta página"
            valor={`${enQuiz} de ${filas.length}`}
            nota="abandonos dentro del quiz"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
        <span className="text-white/40">Ruta:</span>
        <Filtro href={urlCon({ ruta: null })} activo={!filtroRuta}>
          Todas
        </Filtro>
        {RUTAS.map((r) => (
          <Filtro key={r} href={urlCon({ ruta: r })} activo={filtroRuta === r}>
            {r}
          </Filtro>
        ))}
      </div>

      {/* Histograma: en qué pregunta exacta se cae la gente */}
      {rutasAMostrar.map((ruta) => {
        const preguntas = preguntasDeRuta(ruta);
        const datos = preguntas.map((pregunta, i) => {
          const fila = porPregunta.find(
            (p) => p.ruta === ruta && p.pregunta_id === pregunta.id
          );
          return {
            numero: i + 1,
            texto: pregunta.texto,
            abandonos: fila ? Number(fila.abandonos) : 0,
          };
        });
        const maximo = Math.max(...datos.map((d) => d.abandonos), 1);
        const totalRuta = datos.reduce((s, d) => s + d.abandonos, 0);

        return (
          <div key={ruta} className="brand-glass rounded-2xl p-5 mb-5">
            <h2 className="font-display text-sm font-bold text-white/80 uppercase tracking-wide">
              Ruta {ruta} — dónde se cae la gente
            </h2>
            <p className="text-xs text-white/40 mt-1 mb-4">
              Última pregunta que alcanzó a responder antes de irse.
              {totalRuta === 0 && " Todavía sin abandonos registrados."}
            </p>
            <div className="space-y-3">
              {datos.map((d) => (
                <Barra
                  key={d.numero}
                  etiqueta={`${d.numero}. ${d.texto}`}
                  valor={d.abandonos}
                  maximo={maximo}
                  detalle={`${porcentaje(d.abandonos, totalRuta)}%`}
                  acento={d.abandonos === maximo && d.abandonos > 0 ? "naranja" : "neutro"}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Perfil de cada abandono (o de cada diagnóstico completado) */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h2 className="font-display text-sm font-bold text-white/80 uppercase tracking-wide mr-2">
          {vista === "completados" ? "Quién completa" : "Quién abandona"}
        </h2>
        <Filtro href={urlCon({ vista: null })} activo={vista === "abandonos"}>
          Abandonaron
        </Filtro>
        <Filtro href={urlCon({ vista: "completados" })} activo={vista === "completados"}>
          Completaron
        </Filtro>
      </div>

      {filas.length === 0 && (
        <p className="brand-glass rounded-2xl px-4 py-8 text-center text-white/35">
          {vista === "completados"
            ? "Sin diagnósticos completados todavía."
            : "Sin abandonos registrados todavía."}
        </p>
      )}

      <div className="space-y-3">
        {filas.map((fila) => {
          const detalle = (fila.respuestas ?? []) as RespuestaDetallada[];
          const estimada =
            fila.fase ?? faseEstimadaDeDetalle(fila.ruta, detalle);
          const avance = porcentaje(
            fila.preguntas_respondidas,
            fila.total_preguntas ?? preguntasDeRuta(fila.ruta).length
          );

          return (
            <details
              key={fila.id}
              className="brand-glass rounded-2xl px-4 py-3 group"
            >
              <summary className="flex flex-wrap items-center gap-x-3 gap-y-2 cursor-pointer list-none">
                <span className="text-xs text-white/45 whitespace-nowrap">
                  {fechaCorta(fila.ultima_actividad_at)}
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/70">
                  Ruta {fila.ruta}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    fila.estado_efectivo === "capturado"
                      ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/25"
                      : fila.estado_efectivo === "abandono_gate"
                        ? "bg-[var(--brand-accent)]/15 text-[var(--brand-accent-light)] border border-[var(--brand-accent)]/30"
                        : "bg-white/5 text-white/50 border border-white/15"
                  }`}
                >
                  {fila.estado_efectivo === "capturado"
                    ? "Completó y dejó correo"
                    : fila.estado_efectivo === "abandono_gate"
                      ? "Vio su fase, no dejó correo"
                      : `Se fue en la pregunta ${fila.preguntas_respondidas}`}
                </span>
                {fila.estado_efectivo === "capturado" && (fila.nombre || fila.email) && (
                  <span className="text-xs text-white/70">
                    {fila.nombre ?? "—"}
                    {fila.email && <span className="text-white/40"> · {fila.email}</span>}
                  </span>
                )}
                {esAvatar(fila.ruta, fila.propiedades_rango) === true && (
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    Avatar
                  </span>
                )}
                {fila.es_prueba && (
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                    Prueba
                  </span>
                )}
                {estimada && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_FASE[estimada]}`}
                  >
                    {fila.fase ? estimada : `~${estimada}`}
                  </span>
                )}
                <span className="text-xs text-white/35 ml-auto">
                  {fila.preguntas_respondidas}/
                  {fila.total_preguntas ?? preguntasDeRuta(fila.ruta).length} ({avance}%)
                  {fila.utm_campaign && ` · ${fila.utm_source ?? "?"}/${fila.utm_campaign}`}
                </span>
              </summary>

              <div className="mt-3 border-t border-white/10 pt-3 space-y-2">
                {/* La ruta es la respuesta a cuántas propiedades tiene */}
                <div className="text-xs">
                  <p className="text-white/45">{respuestaBifurcacion(fila.ruta).pregunta}</p>
                  <p className="text-white/85">
                    {respuestaBifurcacion(fila.ruta, fila.propiedades_rango).respuesta}
                  </p>
                </div>
                {detalle.length === 0 && (
                  <p className="text-xs text-white/35">Sin respuestas guardadas.</p>
                )}
                {detalle.map((r) => (
                  <div key={r.preguntaId} className="text-xs">
                    <p className="text-white/45">{r.pregunta}</p>
                    <p className="text-white/85">
                      {r.opcion}
                      {r.puntos !== null && (
                        <span className="ml-2 font-mono text-white/40">
                          {r.puntos} pt
                        </span>
                      )}
                    </p>
                  </div>
                ))}
                {(fila.utm_source || fila.utm_content) && (
                  <p className="text-[11px] text-white/35 pt-1">
                    Origen: {fila.utm_source ?? "—"} · {fila.utm_campaign ?? "—"} ·{" "}
                    {fila.utm_content ?? "—"}
                    {fila.utm_term && ` · ${fila.utm_term}`}
                  </p>
                )}
                <div className="pt-1 -ml-2">
                  <BotonPrueba
                    id={fila.id}
                    esPrueba={Boolean(fila.es_prueba)}
                    volver={urlCon({ pagina: pagina > 1 ? String(pagina) : null })}
                  />
                </div>
                {!fila.fase && (
                  <p className="text-[11px] text-white/30 pt-1">
                    La fase marcada con ~ es una estimación proyectada desde las
                    respuestas parciales, no un diagnóstico real.
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-5 text-sm">
        <span className="text-white/40">
          {total} {vista === "completados" ? "completado" : "abandono"}
          {total === 1 ? "" : "s"} · página {pagina} de {totalPaginas}
        </span>
        <div className="flex gap-2">
          {pagina > 1 && (
            <Filtro href={urlCon({ pagina: String(pagina - 1) })} activo={false}>
              ← Anterior
            </Filtro>
          )}
          {pagina < totalPaginas && (
            <Filtro href={urlCon({ pagina: String(pagina + 1) })} activo={false}>
              Siguiente →
            </Filtro>
          )}
        </div>
      </div>
    </Marco>
  );
}
