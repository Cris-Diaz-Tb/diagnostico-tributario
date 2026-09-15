import { redirect } from "next/navigation";
import type { Viewport } from "next";
import { esAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import {
  DIAGNOSTICOS_DEMO,
  embudoDemo,
  resumenDemo,
  type EstadoEfectivo,
} from "@/lib/demo-data";
import {
  Barra,
  COLOR_FASE,
  Contador,
  FASES,
  Filtro,
  Marco,
  TablaVacia,
  fechaCorta,
  porcentaje,
} from "./ui";
import type { FaseId, Ruta } from "@/content/tipos";
import { RUTAS, TEXTO_INTENCION, TEXTO_PROBLEMA } from "@/content/preguntas";
import { OFERTAS } from "@/content/ofertas";

export const metadata = { title: "Panel | Cris. Tributario" };
export const viewport: Viewport = { themeColor: "#0A0F16" };
export const dynamic = "force-dynamic";

const POR_PAGINA = 20;

const ESTADOS: Array<{ id: EstadoEfectivo; texto: string }> = [
  { id: "capturado", texto: "Dejó email" },
  { id: "abandono_gate", texto: "Abandonó en el gate" },
  { id: "abandono_preguntas", texto: "Abandonó en preguntas" },
  { id: "en_curso", texto: "En curso" },
];

const ETIQUETA_ESTADO: Record<EstadoEfectivo, { texto: string; clase: string }> = {
  capturado: {
    texto: "Dejó email",
    clase: "bg-emerald-400/10 text-emerald-300 border border-emerald-400/25",
  },
  abandono_gate: {
    texto: "Abandonó gate",
    clase: "bg-[var(--brand-accent)]/15 text-[var(--brand-accent-light)] border border-[var(--brand-accent)]/30",
  },
  abandono_preguntas: {
    texto: "Abandonó quiz",
    clase: "bg-white/5 text-white/50 border border-white/15",
  },
  en_curso: {
    texto: "En curso",
    clase: "bg-sky-400/10 text-sky-300 border border-sky-400/25",
  },
};

interface FilaResumen {
  ruta: Ruta;
  fase: FaseId;
  /** resumen_fases separa por escala: la v2 cambió el rango del score. */
  version_cuestionario?: number;
  total: number;
  con_email: number;
  score_promedio: number;
}


interface FilaEmbudo {
  ruta: Ruta;
  iniciados: number;
  completados: number;
  capturados: number;
  abandono_preguntas: number;
  abandono_gate: number;
  en_curso: number;
}

interface FilaDiagnostico {
  id: string;
  nombre: string | null;
  email: string | null;
  fecha_creacion: string;
  ruta: Ruta;
  fase: FaseId | null;
  score_numerico: number | null;
  estado_efectivo: EstadoEfectivo;
  preguntas_respondidas: number;
  total_preguntas: number | null;
  oferta_recomendada: string | null;
  problema_principal: string | null;
  problema_otro: string | null;
  nivel_intencion: string | null;
  texto_abierto: string | null;
}

const COLUMNAS_TABLA =
  "id, nombre, email, fecha_creacion, ruta, fase, score_numerico, estado_efectivo, preguntas_respondidas, total_preguntas, oferta_recomendada, problema_principal, problema_otro, nivel_intencion, texto_abierto";

export default async function PanelAdmin({
  searchParams,
}: {
  searchParams: Promise<{
    pagina?: string;
    ruta?: string;
    fase?: string;
    estado?: string;
  }>;
}) {
  if (!(await esAdmin())) redirect("/admin/login");

  const params = await searchParams;
  const pagina = Math.max(1, parseInt(params.pagina ?? "1", 10) || 1);
  const filtroRuta = RUTAS.includes(params.ruta as Ruta) ? (params.ruta as Ruta) : null;
  const filtroFase = FASES.includes(params.fase as FaseId)
    ? (params.fase as FaseId)
    : null;
  const filtroEstado = ESTADOS.some((e) => e.id === params.estado)
    ? (params.estado as EstadoEfectivo)
    : null;

  const supabase = getSupabase();
  const usandoDemo = !supabase;

  let resumen: FilaResumen[];
  let embudo: FilaEmbudo[];
  let filas: FilaDiagnostico[];
  let totalFiltrado: number;

  if (supabase) {
    // Agregados siempre desde las vistas SQL — nunca sumando filas aquí.
    const [{ data: resumenCrudo }, { data: embudoCrudo }] = await Promise.all([
      supabase.from("resumen_fases").select("*"),
      supabase.from("resumen_embudo").select("*"),
    ]);
    resumen = (resumenCrudo ?? []) as FilaResumen[];
    embudo = (embudoCrudo ?? []) as FilaEmbudo[];

    let consulta = supabase
      .from("diagnosticos_embudo")
      .select(COLUMNAS_TABLA, { count: "exact" })
      .order("fecha_creacion", { ascending: false })
      .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

    if (filtroRuta) consulta = consulta.eq("ruta", filtroRuta);
    if (filtroFase) consulta = consulta.eq("fase", filtroFase);
    if (filtroEstado) consulta = consulta.eq("estado_efectivo", filtroEstado);

    const { data: filasCrudas, count } = await consulta;
    filas = (filasCrudas ?? []) as FilaDiagnostico[];
    totalFiltrado = count ?? 0;
  } else {
    resumen = resumenDemo();
    embudo = embudoDemo();
    const todas = DIAGNOSTICOS_DEMO.filter(
      (d) =>
        (!filtroRuta || d.ruta === filtroRuta) &&
        (!filtroFase || d.fase === filtroFase) &&
        (!filtroEstado || d.estado_efectivo === filtroEstado)
    );
    totalFiltrado = todas.length;
    filas = todas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  }

  const suma = (campo: keyof FilaEmbudo) =>
    embudo.reduce((s, r) => s + Number(r[campo] ?? 0), 0);

  const iniciados = suma("iniciados");
  const completados = suma("completados");
  const capturados = suma("capturados");
  const abandonoPreguntas = suma("abandono_preguntas");
  const abandonoGate = suma("abandono_gate");

  const totalConFase = resumen.reduce((s, r) => s + Number(r.total), 0);
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / POR_PAGINA));

  const urlCon = (cambios: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const estado: Record<string, string | null> = {
      ruta: filtroRuta,
      fase: filtroFase,
      estado: filtroEstado,
      pagina: null, // los cambios de filtro resetean la página
      ...cambios,
    };
    for (const [k, v] of Object.entries(estado)) if (v) p.set(k, v);
    const qs = p.toString();
    return qs ? `/admin?${qs}` : "/admin";
  };

  return (
    <Marco usandoDemo={usandoDemo} activa="/admin">
      {/* Contadores del embudo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <Contador
          etiqueta="Iniciados"
          valor={String(iniciados)}
          nota="respondieron ≥1 pregunta"
        />
        <Contador
          etiqueta="Completados"
          valor={String(completados)}
          nota={`${porcentaje(completados, iniciados)}% de los iniciados`}
        />
        <Contador
          etiqueta="Con email"
          valor={String(capturados)}
          matiz="bueno"
          nota={`${porcentaje(capturados, iniciados)}% de los iniciados`}
        />
        <Contador
          etiqueta="Abandono en quiz"
          valor={`${porcentaje(abandonoPreguntas, iniciados)}%`}
          matiz="alerta"
          nota={`${abandonoPreguntas} se cayeron respondiendo`}
        />
        <Contador
          etiqueta="Abandono en gate"
          valor={`${porcentaje(abandonoGate, completados)}%`}
          matiz="alerta"
          nota={`${abandonoGate} vieron su fase y no dejaron correo`}
        />
      </div>

      {/* Embudo visual */}
      <div className="brand-glass rounded-2xl p-5 mb-6 space-y-4">
        <h2 className="font-display text-sm font-bold text-white/80 uppercase tracking-wide">
          Embudo
        </h2>
        <Barra
          etiqueta="Empezaron el diagnóstico"
          valor={iniciados}
          maximo={iniciados}
          detalle="100%"
        />
        <Barra
          etiqueta="Terminaron las preguntas"
          valor={completados}
          maximo={iniciados}
          detalle={`${porcentaje(completados, iniciados)}%`}
        />
        <Barra
          etiqueta="Dejaron su email"
          valor={capturados}
          maximo={iniciados}
          detalle={`${porcentaje(capturados, iniciados)}%`}
        />
      </div>

      {/* Distribución por fase (solo diagnósticos completados) */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs text-white/40 uppercase tracking-wide mr-1">
          Fases
        </span>
        {FASES.map((fase) => {
          // Se suma entre versiones del cuestionario: resumen_fases las
          // separa porque el score no es comparable entre escalas, pero
          // el conteo de personas por fase sí.
          const cantidad = resumen
            .filter((r) => r.fase === fase)
            .reduce((s, r) => s + Number(r.total), 0);
          return (
            <span
              key={fase}
              className={`rounded-full px-3 py-1 text-xs font-medium ${COLOR_FASE[fase]}`}
            >
              {fase}: {cantidad} ({porcentaje(cantidad, totalConFase)}%)
            </span>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
        <span className="text-white/40">Ruta:</span>
        <Filtro href={urlCon({ ruta: null, fase: null })} activo={!filtroRuta}>
          Todas
        </Filtro>
        {RUTAS.map((r) => (
          <Filtro key={r} href={urlCon({ ruta: r, fase: null })} activo={filtroRuta === r}>
            {r}
          </Filtro>
        ))}
        <span className="text-white/40 ml-3">Fase:</span>
        <Filtro href={urlCon({ fase: null })} activo={!filtroFase}>
          Todas
        </Filtro>
        {FASES.filter((f) => !filtroRuta || f.startsWith(filtroRuta)).map((f) => (
          <Filtro key={f} href={urlCon({ fase: f })} activo={filtroFase === f}>
            {f}
          </Filtro>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
        <span className="text-white/40">Estado:</span>
        <Filtro href={urlCon({ estado: null })} activo={!filtroEstado}>
          Todos
        </Filtro>
        {ESTADOS.map((e) => (
          <Filtro key={e.id} href={urlCon({ estado: e.id })} activo={filtroEstado === e.id}>
            {e.texto}
          </Filtro>
        ))}

        {/* El análisis de los textos abiertos se hace fuera de la plataforma */}
        <a
          href={filtroRuta ? `/admin/exportar?ruta=${filtroRuta}` : "/admin/exportar"}
          className="ml-auto rounded-full border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/10 px-3.5 py-1 text-[var(--brand-accent-light)] hover:bg-[var(--brand-accent)]/20 transition"
        >
          ↓ Exportar CSV
        </a>
      </div>

      {/* Tabla */}
      <div className="brand-glass overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-white/45 uppercase tracking-wide">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Avance</th>
              <th className="px-4 py-3">Fase</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3">Oferta a ofrecer</th>
              <th className="px-4 py-3">Problema principal</th>
              <th className="px-4 py-3">Ya intentó</th>
              <th className="px-4 py-3">Nos escribió</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <TablaVacia columnas={11} texto="Sin diagnósticos todavía." />
            )}
            {filas.map((fila) => {
              const etiqueta = ETIQUETA_ESTADO[fila.estado_efectivo];
              return (
                <tr
                  key={fila.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-4 py-3 text-white/85">{fila.nombre ?? "—"}</td>
                  <td className="px-4 py-3 text-white/70">
                    {fila.email ?? (
                      <span className="text-white/30 italic">sin capturar</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-white/45">
                    {fechaCorta(fila.fecha_creacion)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${etiqueta.clase}`}
                    >
                      {etiqueta.texto}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-white/60">
                    {fila.preguntas_respondidas}/{fila.total_preguntas ?? "?"}
                  </td>
                  <td className="px-4 py-3">
                    {fila.fase ? (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_FASE[fila.fase]}`}
                      >
                        {fila.fase}
                      </span>
                    ) : (
                      <span className="text-white/25">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white/85">
                    {fila.score_numerico ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-white/60">
                    {fila.oferta_recomendada ? (
                      OFERTAS[fila.oferta_recomendada as keyof typeof OFERTAS]?.nombre ?? fila.oferta_recomendada
                    ) : (
                      <span className="text-white/25">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {fila.problema_principal ? (
                      <span title={fila.problema_otro ?? undefined}>
                        {TEXTO_PROBLEMA[fila.problema_principal] ?? fila.problema_principal}
                        {fila.problema_otro && (
                          <span className="block text-[11px] text-white/40 max-w-[16rem] truncate">
                            {fila.problema_otro}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-white/25">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-white/60">
                    {fila.nivel_intencion ? (
                      TEXTO_INTENCION[fila.nivel_intencion] ?? fila.nivel_intencion
                    ) : (
                      <span className="text-white/25">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {fila.texto_abierto ? (
                      <span
                        title={fila.texto_abierto}
                        className="block max-w-[18rem] truncate"
                      >
                        {fila.texto_abierto}
                      </span>
                    ) : (
                      <span className="text-white/25">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-white/40">
          {totalFiltrado} resultado{totalFiltrado === 1 ? "" : "s"} · página{" "}
          {pagina} de {totalPaginas}
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
