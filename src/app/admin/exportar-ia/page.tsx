import { redirect } from "next/navigation";
import type { Viewport } from "next";
import { esAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { DIAGNOSTICOS_DEMO } from "@/lib/demo-data";
import { RUTAS } from "@/content/preguntas";
import { PROMPT_SUGERIDO, SEGMENTOS_IA, TEXTO_SEGMENTO, type SegmentoIA } from "@/lib/exportacion-ia";
import { Contador, Marco } from "../ui";

export const metadata = { title: "Exportar para IA | Cris. Tributario" };
export const viewport: Viewport = { themeColor: "#0A0F16" };
export const dynamic = "force-dynamic";

const CLASE_CAMPO =
  "mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[var(--brand-accent)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/25 transition";

async function contarSegmentos(): Promise<Record<SegmentoIA, number>> {
  const supabase = getSupabase();
  const conteo = { capturado: 0, abandono_gate: 0 };

  if (!supabase) {
    for (const s of SEGMENTOS_IA) {
      conteo[s] = DIAGNOSTICOS_DEMO.filter((d) => d.estado_efectivo === s).length;
    }
    return conteo;
  }

  await Promise.all(
    SEGMENTOS_IA.map(async (s) => {
      const { count } = await supabase
        .from("diagnosticos_embudo")
        .select("id", { count: "exact", head: true })
        .eq("estado_efectivo", s)
        .eq("es_prueba", false);
      conteo[s] = count ?? 0;
    })
  );
  return conteo;
}

export default async function PaginaExportarIa() {
  if (!(await esAdmin())) redirect("/admin/login");

  const conteo = await contarSegmentos();

  return (
    <Marco usandoDemo={!getSupabase()} activa="/admin/exportar-ia">
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Contador etiqueta="Completaron y dejaron datos" valor={String(conteo.capturado)} matiz="bueno" />
        <Contador
          etiqueta="Abandonaron en el gate"
          valor={String(conteo.abandono_gate)}
          matiz="alerta"
          nota="vieron su fase, no dejaron datos"
        />
      </div>

      {/* GET a la ruta de descarga: el navegador baja el archivo sin estado de cliente */}
      <form action="/admin/exportar-ia/descargar" method="get" className="space-y-6">
        <section className="brand-glass rounded-2xl p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="font-display text-xl text-white">Exportar respuestas para IA</h2>
            <p className="mt-1 text-sm text-white/55 leading-relaxed">
              Genera un archivo con cada diagnóstico completo, la pregunta entera junto a
              cada respuesta y el texto libre, listo para subirlo a Claude o ChatGPT y
              comparar a quienes convierten con quienes se van en el gate. Incluye
              cuántas propiedades tiene cada persona y el origen completo de la visita.
            </p>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-white/85">Segmentos</legend>
            <div className="mt-2 space-y-2">
              {SEGMENTOS_IA.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm text-white/75">
                  <input
                    type="checkbox"
                    name="segmento"
                    value={s}
                    defaultChecked
                    className="h-4 w-4 accent-[var(--brand-accent)]"
                  />
                  {TEXTO_SEGMENTO[s]} ({conteo[s]})
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-white/85">Ruta</span>
              <select name="ruta" defaultValue="" className={CLASE_CAMPO}>
                <option value="">Todas</option>
                {RUTAS.map((r) => (
                  <option key={r} value={r}>
                    Ruta {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-white/85">Desde (opcional)</span>
              <input type="date" name="desde" className={`${CLASE_CAMPO} [color-scheme:dark]`} />
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-white/85">Formato</legend>
            <div className="mt-2 space-y-2 text-sm text-white/75">
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name="formato"
                  value="md"
                  defaultChecked
                  className="mt-0.5 h-4 w-4 accent-[var(--brand-accent)]"
                />
                <span>
                  Markdown (.md) <span className="text-white/45">· para adjuntar en un chat. Trae el contexto del quiz y un prompt sugerido al inicio.</span>
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name="formato"
                  value="jsonl"
                  className="mt-0.5 h-4 w-4 accent-[var(--brand-accent)]"
                />
                <span>
                  JSONL (.jsonl) <span className="text-white/45">· una persona por línea, para procesar por lotes con la API o en Python.</span>
                </span>
              </label>
            </div>
          </fieldset>

          <label className="flex items-start gap-2 text-sm text-white/75">
            <input
              type="checkbox"
              name="contacto"
              value="1"
              className="mt-0.5 h-4 w-4 accent-[var(--brand-accent)]"
            />
            <span>
              Incluir nombre, email y WhatsApp{" "}
              <span className="text-white/45">
                · déjalo desmarcado para no subir datos personales a la IA. Cada caso
                lleva su código de diagnóstico, así lo encuentras después en el panel.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm text-white/75">
            <input
              type="checkbox"
              name="pruebas"
              value="1"
              className="mt-0.5 h-4 w-4 accent-[var(--brand-accent)]"
            />
            <span>
              Incluir pruebas internas{" "}
              <span className="text-white/45">
                · los conteos de arriba ya las excluyen. Si las incluyes, cada una sale
                marcada como prueba.
              </span>
            </span>
          </label>

          <button className="rounded-full border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/10 px-5 py-2 text-sm text-[var(--brand-accent-light)] hover:bg-[var(--brand-accent)]/20 transition">
            ↓ Descargar archivo
          </button>
        </section>
      </form>

      <section className="brand-glass rounded-2xl p-5 sm:p-6 mt-6">
        <h2 className="font-display text-sm font-bold text-white/80 uppercase tracking-wide">
          Prompt sugerido
        </h2>
        <p className="text-xs text-white/40 mt-1 mb-3">
          Ya viene dentro del Markdown. Si usas JSONL, pégalo junto al archivo.
        </p>
        <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-white/75 leading-relaxed">
          {PROMPT_SUGERIDO}
        </pre>
      </section>
    </Marco>
  );
}
