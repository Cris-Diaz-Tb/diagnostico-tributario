import { notFound } from "next/navigation";
import type { Viewport } from "next";
import { getSupabase } from "@/lib/supabase";
import { ctaEfectivo, etapaDeFase, FASES, ROADMAPS } from "@/content/roadmaps";
import { NOMBRE_RUTA } from "@/content/preguntas";
import { COPY } from "@/content/copy";
import { ofertaDeRoadmap } from "@/content/ofertas";
import { urlWebinarActiva } from "@/content/webinar";
import { datosDeOrigen } from "@/content/origenes";
import { urlWebinarLanzamiento } from "@/lib/webinar-lanzamiento";
import { urlAsesoria } from "@/lib/agenda";
import { urlWhatsapp } from "@/lib/whatsapp";
import type { FaseId, Ruta } from "@/content/tipos";
import { BadgePlaceholder } from "@/components/BadgePlaceholder";
import { TrackerResultado } from "@/components/TrackerResultado";
import { BotonWhatsapp } from "@/components/BotonWhatsapp";
import { BotonAccion } from "@/components/BotonAccion";
import { BrandBackdrop } from "@/components/brand/BrandBackdrop";

export const metadata = {
  title: "Tu diagnóstico | Cris. Tributario",
};

export const viewport: Viewport = { themeColor: "#0A0F16" };

interface DatosResultado {
  fase: FaseId;
  tag: string | null;
  /** Identificador que viaja al enlace de asesoría para cruzar venta y respuestas. */
  identificador: string;
  /** Diagnóstico de un lanzamiento: el siguiente paso es el webinar. */
  esLanzamiento: boolean;
  /** Id base de eventos de Meta de este diagnóstico (columna evento_id). */
  eventoId: string | null;
}

async function datosDeToken(token: string): Promise<DatosResultado | null> {
  const supabase = getSupabase();

  // Tokens demo (sin base de datos): demo-<fase>-<random>. Solo válidos
  // en desarrollo local; en producción todos los resultados son reales.
  if (token.startsWith("demo-")) {
    if (supabase) return null;
    const fase = token.split("-")[1] as FaseId;
    return FASES.includes(fase)
      ? { fase, tag: null, identificador: token, esLanzamiento: false, eventoId: token }
      : null;
  }

  if (!supabase) return null;

  const { data } = await supabase
    .from("diagnosticos")
    .select("id, fase, problema_principal, origen, evento_id")
    .eq("token_resultado", token)
    .maybeSingle();

  if (!data || !FASES.includes(data.fase as FaseId)) return null;
  return {
    fase: data.fase as FaseId,
    tag: data.problema_principal as string | null,
    identificador: data.id as string,
    esLanzamiento: Boolean(datosDeOrigen(data.origen).esLanzamiento),
    eventoId: (data.evento_id as string | null) ?? null,
  };
}

export default async function PaginaResultado({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const datos = await datosDeToken(token);
  if (!datos) notFound();
  const { fase, tag, identificador, esLanzamiento, eventoId } = datos;

  const roadmap = ROADMAPS[fase];
  const ruta = fase[0] as Ruta;
  const esDemo = token.startsWith("demo-");
  const esArquitectura = ofertaDeRoadmap(roadmap, tag).id === "asesoria_patrimonial";
  const enlaceWebinar = urlWebinarActiva();
  const [enlaceAsesoria, enlaceWhatsapp, enlaceWebinarLanzamiento] = await Promise.all([
    urlAsesoria(identificador, fase),
    urlWhatsapp(identificador, fase),
    esLanzamiento ? urlWebinarLanzamiento() : null,
  ]);

  return (
    <BrandBackdrop
      outerClassName="flex-1"
      innerClassName="flex-1 flex flex-col items-center px-4 py-10"
    >
      <TrackerResultado fase={fase} eventoId={eventoId} />
      <div className="w-full max-w-xl">
        <p className="mb-8 text-center text-xs font-semibold tracking-[0.2em] text-white/60 uppercase">
          {COPY.marca.nombre}
        </p>

        {esDemo && (
          <p className="mb-4 rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs px-3 py-2">
            {COPY.demo.aviso}
          </p>
        )}

        <div className="brand-glass brand-pop-in relative overflow-hidden rounded-3xl p-6 sm:p-8">
          <span className="inline-flex items-center rounded-full bg-[var(--brand-accent)]/12 border border-[var(--brand-accent)]/40 px-3 py-1 text-[11px] font-semibold tracking-wide text-[var(--brand-accent-light)] uppercase">
            {COPY.resultado.etiquetaFase(NOMBRE_RUTA[ruta], etapaDeFase(fase))}
          </span>
          <BadgePlaceholder visible={roadmap.status === "placeholder"} />

          <h1 className="font-display text-3xl sm:text-4xl font-medium mt-4 leading-tight text-white">
            {roadmap.parteA.titulo}
          </h1>
          <p className="mt-4 text-white/75 leading-relaxed">
            {roadmap.parteA.diagnostico}
          </p>

          <h2 className="font-display mt-9 text-xl font-medium text-white">
            {COPY.resultado.tusPasos}
          </h2>
          <ol className="mt-5 space-y-5">
            {roadmap.parteB.pasos.map((paso, i) => (
              <li
                key={i}
                className="brand-pop-in flex gap-4"
                style={{ animationDelay: `${0.15 + i * 0.12}s` }}
              >
                <span className="flex-none flex h-8 w-8 items-center justify-center rounded-full border border-[var(--brand-accent)]/60 text-sm font-semibold text-[var(--brand-accent-light)]">
                  {i + 1}
                </span>
                <p className="text-sm sm:text-base text-white/80 leading-relaxed pt-1">
                  {paso}
                </p>
              </li>
            ))}
          </ol>

          {!esDemo && (
            <p className="mt-8 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm px-4 py-3">
              {COPY.resultado.guardado}
            </p>
          )}
        </div>

        {esLanzamiento ? (
          <div
            className="brand-glass brand-pop-in rounded-3xl p-6 sm:p-8 text-center mt-6"
            style={{ animationDelay: "0.4s" }}
          >
            <h2 className="font-display text-2xl font-medium text-white">
              {COPY.lanzamiento.ctaTitulo}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/75 leading-relaxed max-w-md mx-auto">
              {COPY.lanzamiento.ctaTexto}
            </p>
            {enlaceWebinarLanzamiento ? (
              <BotonAccion
                href={enlaceWebinarLanzamiento}
                accion="clic_webinar"
                token={token}
                fase={fase}
                className="brand-btn-cta mt-6 inline-block w-full sm:w-auto rounded-2xl px-8 py-4 font-semibold"
              >
                {COPY.lanzamiento.ctaBoton}
              </BotonAccion>
            ) : (
              <p className="mt-5 text-sm text-white/60 leading-relaxed max-w-md mx-auto">
                {COPY.lanzamiento.ctaSinEnlace}
              </p>
            )}
          </div>
        ) : (
          <div
            className="brand-glass brand-pop-in rounded-3xl p-6 sm:p-8 text-center mt-6"
            style={{ animationDelay: "0.4s" }}
          >
            <h2 className="font-display text-2xl font-medium text-white">
              {COPY.resultado.ctaTitulo}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/75 leading-relaxed max-w-md mx-auto">
              {ctaEfectivo(roadmap, tag)}
            </p>
            {esArquitectura && (
              <>
                <p className="mt-3 text-sm sm:text-base text-white/75 leading-relaxed max-w-md mx-auto">
                  {COPY.resultado.ctaEntregable}
                </p>
                <p className="mt-5 text-sm font-semibold text-white/90 leading-relaxed max-w-md mx-auto text-balance">
                  {COPY.resultado.ctaRespaldo}
                </p>
              </>
            )}
            {enlaceAsesoria ? (
              <BotonAccion
                href={enlaceAsesoria}
                accion="clic_agendar"
                token={token}
                fase={fase}
                className="brand-btn-cta mt-6 inline-block w-full sm:w-auto rounded-2xl px-8 py-4 font-semibold"
              >
                {COPY.resultado.ctaBoton}
              </BotonAccion>
            ) : (
              <a
                href={COPY.marca.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="brand-btn-cta mt-6 inline-block w-full sm:w-auto rounded-2xl px-8 py-4 font-semibold"
              >
                {COPY.resultado.ctaSinEnlace}
              </a>
            )}
            {enlaceAsesoria && (
              <p className="mt-4 text-xs text-white/50 leading-relaxed">
                {COPY.resultado.ctaNota}
              </p>
            )}
            {enlaceWhatsapp && (
              <div className="mt-6 border-t border-white/10 pt-5">
                <BotonWhatsapp
                  href={enlaceWhatsapp}
                  token={token}
                  fase={fase}
                  texto={COPY.whatsapp.boton}
                />
                <p className="mt-3 text-xs text-white/50 leading-relaxed">
                  {COPY.whatsapp.nota}
                </p>
              </div>
            )}
            {enlaceWebinar && (
              <BotonAccion
                href={enlaceWebinar}
                accion="clic_webinar"
                token={token}
                fase={fase}
                className="mt-5 inline-block text-sm text-white/60 underline underline-offset-4 decoration-white/25 hover:text-white hover:decoration-[var(--brand-accent)] transition"
              >
                {COPY.webinar.boton}
              </BotonAccion>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-white/40 leading-relaxed">
          {COPY.avisoLegal}
        </p>
      </div>
    </BrandBackdrop>
  );
}
