import { redirect } from "next/navigation";
import type { Viewport } from "next";
import { esAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { utmDemo } from "@/lib/demo-data";
import { Contador, Filtro, Marco, TablaVacia, porcentaje } from "../ui";

export const metadata = { title: "Atribución | Cris. Tributario" };
export const viewport: Viewport = { themeColor: "#0A0F16" };
export const dynamic = "force-dynamic";

type Agrupacion = "content" | "campaign" | "source";

const AGRUPACIONES: Array<{ id: Agrupacion; texto: string }> = [
  { id: "content", texto: "Pieza (utm_content)" },
  { id: "campaign", texto: "Campaña" },
  { id: "source", texto: "Fuente" },
];

interface FilaUtm {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  iniciados: number;
  completados: number;
  capturados: number;
}

interface FilaAgrupada {
  clave: string;
  detalle: string;
  iniciados: number;
  completados: number;
  capturados: number;
}

/**
 * Agrupa según el nivel elegido. El nivel `content` es el que responde
 * "¿qué Reel concreto trae gente que sí termina?", que es la decisión de
 * contenido real; los otros dos sirven para mirar más arriba.
 */
function agrupar(filas: FilaUtm[], nivel: Agrupacion): FilaAgrupada[] {
  const mapa = new Map<string, FilaAgrupada>();

  for (const fila of filas) {
    const clave =
      nivel === "source"
        ? fila.utm_source
        : nivel === "campaign"
          ? `${fila.utm_source} · ${fila.utm_campaign}`
          : `${fila.utm_campaign} · ${fila.utm_content}`;

    const detalle =
      nivel === "source"
        ? fila.utm_medium
        : nivel === "campaign"
          ? fila.utm_medium
          : fila.utm_source;

    const entrada = mapa.get(clave) ?? {
      clave,
      detalle,
      iniciados: 0,
      completados: 0,
      capturados: 0,
    };
    entrada.iniciados += Number(fila.iniciados);
    entrada.completados += Number(fila.completados);
    entrada.capturados += Number(fila.capturados);
    mapa.set(clave, entrada);
  }

  return Array.from(mapa.values()).sort((a, b) => b.iniciados - a.iniciados);
}

export default async function PanelUtm({
  searchParams,
}: {
  searchParams: Promise<{ por?: string }>;
}) {
  if (!(await esAdmin())) redirect("/admin/login");

  const params = await searchParams;
  const nivel = AGRUPACIONES.some((a) => a.id === params.por)
    ? (params.por as Agrupacion)
    : "content";

  const supabase = getSupabase();
  const usandoDemo = !supabase;

  let crudas: FilaUtm[];
  if (supabase) {
    const { data } = await supabase.from("resumen_utm").select("*");
    crudas = (data ?? []) as FilaUtm[];
  } else {
    crudas = utmDemo();
  }

  const filas = agrupar(crudas, nivel);
  const totalIniciados = filas.reduce((s, f) => s + f.iniciados, 0);
  const totalCapturados = filas.reduce((s, f) => s + f.capturados, 0);

  // La mejor fuente es la que convierte, no la que más tráfico trae.
  const mejor = [...filas]
    .filter((f) => f.iniciados >= 3)
    .sort(
      (a, b) =>
        porcentaje(b.capturados, b.iniciados) - porcentaje(a.capturados, a.iniciados)
    )[0];

  return (
    <Marco usandoDemo={usandoDemo} activa="/admin/utm">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Contador etiqueta="Orígenes distintos" valor={String(filas.length)} />
        <Contador
          etiqueta="Tasa de captura global"
          valor={`${porcentaje(totalCapturados, totalIniciados)}%`}
          matiz="bueno"
          nota={`${totalCapturados} de ${totalIniciados} iniciados`}
        />
        <Contador
          etiqueta="Mejor origen"
          valor={mejor ? `${porcentaje(mejor.capturados, mejor.iniciados)}%` : "—"}
          nota={mejor?.clave ?? "hace falta más volumen"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
        <span className="text-white/40">Agrupar por:</span>
        {AGRUPACIONES.map((a) => (
          <Filtro
            key={a.id}
            href={a.id === "content" ? "/admin/utm" : `/admin/utm?por=${a.id}`}
            activo={nivel === a.id}
          >
            {a.texto}
          </Filtro>
        ))}
      </div>

      <div className="brand-glass overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-white/45 uppercase tracking-wide">
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3 text-right">Iniciaron</th>
              <th className="px-4 py-3 text-right">Completaron</th>
              <th className="px-4 py-3 text-right">Dejaron email</th>
              <th className="px-4 py-3 text-right">% completa</th>
              <th className="px-4 py-3 text-right">% captura</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <TablaVacia
                columnas={6}
                texto="Sin tráfico atribuido todavía. Usa links con utm_source y utm_content en tus publicaciones."
              />
            )}
            {filas.map((fila) => {
              const pctCaptura = porcentaje(fila.capturados, fila.iniciados);
              return (
                <tr
                  key={fila.clave}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-white/85">{fila.clave}</span>
                    <span className="block text-[11px] text-white/35">
                      {fila.detalle}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white/70">
                    {fila.iniciados}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white/70">
                    {fila.completados}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white/85">
                    {fila.capturados}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white/60">
                    {porcentaje(fila.completados, fila.iniciados)}%
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-bold ${
                      pctCaptura >= 30
                        ? "text-emerald-300"
                        : pctCaptura >= 15
                          ? "text-white/85"
                          : "text-[var(--brand-accent-light)]"
                    }`}
                  >
                    {pctCaptura}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-white/35 mt-4 leading-relaxed">
        Para que una pieza aparezca aquí con nombre propio, publícala con su
        propio <code className="text-white/50">utm_content</code>. Ejemplo:{" "}
        <code className="text-white/50">
          ?utm_source=instagram&amp;utm_campaign=lanzamiento-1&amp;utm_content=reel-3
        </code>
      </p>
    </Marco>
  );
}
