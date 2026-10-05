import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { COPY } from "@/content/copy";
import { BadgePlaceholder } from "@/components/BadgePlaceholder";
import { BrandBackdrop } from "@/components/brand/BrandBackdrop";

/**
 * Landing larga para tráfico frío de anuncios. La portada (/) es corta y
 * sirve a quien ya conoce a Cris; esta explica las 3 etapas y los 3
 * errores antes de pedir el clic. Todo termina en /diagnostico.
 */
export const metadata: Metadata = {
  title: "Las 3 etapas de tu patrimonio inmobiliario | Cris. Tributario",
  description: COPY.landingEtapas.subtitulo,
};

export const viewport: Viewport = { themeColor: "#0A0F16" };

const HREF = "/diagnostico";
const T = COPY.landingEtapas;

function BotonDiagnostico({ texto, className = "" }: { texto: string; className?: string }) {
  return (
    <Link
      href={HREF}
      className={`brand-btn-cta inline-block w-full sm:w-auto rounded-2xl px-9 py-4 font-semibold text-base text-center ${className}`}
    >
      {texto} <span aria-hidden="true">→</span>
    </Link>
  );
}

function Seccion({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`px-4 py-16 sm:py-20 ${className}`}>{children}</section>;
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-3xl sm:text-4xl font-medium leading-[1.15] text-center">
      {children}
    </h2>
  );
}

export default function LandingEtapas() {
  return (
    <div className="brand-shell font-body-brand flex-1 pb-24 sm:pb-0">
      {/* Gancho */}
      <BrandBackdrop
        as="div"
        innerClassName="px-4 pt-14 pb-20 sm:pt-20 sm:pb-28 flex justify-center"
      >
        <header className="w-full max-w-2xl text-center brand-pop-in">
          <p className="text-xs font-semibold tracking-[0.2em] text-white/60 uppercase">
            {COPY.marca.nombre}
          </p>
          <p className="mt-6 inline-block rounded-full border border-[var(--brand-accent)]/40 px-3.5 py-1 text-xs font-medium text-[var(--brand-accent-light)]">
            {T.etiqueta}
          </p>
          <h1 className="font-display mt-5 text-4xl sm:text-5xl font-medium leading-[1.1]">
            <span className="brand-text-gradient">{T.titulo}</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-[var(--brand-text-muted)] leading-relaxed">
            {T.subtitulo}
          </p>
          <div className="mt-10">
            <BotonDiagnostico texto={T.boton} />
            <p className="mt-4 text-sm text-[var(--brand-text-muted)]">{T.nota}</p>
            <p className="mt-2 text-sm text-white/55">{COPY.landing.pruebaSocial}</p>
          </div>
        </header>
      </BrandBackdrop>

      <main>
        {/* Las 3 etapas */}
        <Seccion className="bg-[var(--brand-bg-soft)] border-y border-[var(--brand-border)]">
          <div className="mx-auto max-w-5xl">
            <Titulo>{T.etapasTitulo}</Titulo>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--brand-text-muted)] leading-relaxed">
              {T.etapasIntro}
            </p>
            <ol className="mt-12 grid gap-4 sm:grid-cols-3">
              {T.etapas.map((etapa, i) => (
                <li key={etapa.nombre} className="brand-glass rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[var(--brand-accent)]/50 text-sm font-semibold text-[var(--brand-accent-light)]">
                      {i + 1}
                    </span>
                    <span className="text-xs font-semibold tracking-[0.15em] uppercase text-white/50">
                      Etapa {i + 1}
                    </span>
                  </div>
                  {/* Barra que se llena según la etapa */}
                  <div className="brand-progress-track mt-5" aria-hidden="true">
                    <div
                      className="brand-progress-fill"
                      style={{ width: `${((i + 1) / 3) * 100}%` }}
                    />
                  </div>
                  <h3 className="font-display mt-5 text-xl font-medium">{etapa.nombre}</h3>
                  <p className="mt-2 text-sm text-white/75 leading-relaxed">{etapa.texto}</p>
                </li>
              ))}
            </ol>
            <p className="mt-8 text-center text-sm text-[var(--brand-text-muted)]">
              {T.etapasCierre}
            </p>
            <div className="mt-8 text-center">
              <BotonDiagnostico texto={T.boton} />
            </div>
          </div>
        </Seccion>

        {/* Cris y los 3 errores */}
        <Seccion>
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-col items-center text-center">
              <div
                aria-hidden="true"
                className="flex h-20 w-20 items-center justify-center rounded-full border border-[var(--brand-accent)]/50 bg-[var(--brand-surface)] font-display text-3xl text-[var(--brand-accent-light)]"
              >
                C
              </div>
              <Titulo>
                <span className="mt-6 block">{T.autorSaludo}</span>
              </Titulo>
              <p className="mt-4 max-w-2xl text-[var(--brand-text-muted)] leading-relaxed">
                {T.autorIntro}
              </p>
            </div>

            <ol className="mt-10 space-y-3">
              {T.errores.map((error, i) => (
                <li key={error.titulo} className="brand-glass flex gap-4 rounded-2xl p-5 sm:p-6">
                  <span className="font-display flex-none text-2xl leading-none text-[var(--brand-bronce)]">
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white/95">{error.titulo}</h3>
                    <p className="mt-1.5 text-sm text-white/70 leading-relaxed">{error.texto}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-8 text-center text-white/80 leading-relaxed">{T.autorCierre}</p>
            <p className="mt-6 text-center text-sm">
              <span className="font-semibold">{COPY.marca.nombre}</span>
              <span className="block text-[var(--brand-text-muted)]">{COPY.marca.firma}</span>
            </p>
            <div className="mt-10 text-center">
              <BotonDiagnostico texto={T.botonMedio} />
            </div>
          </div>
        </Seccion>

        {/* Qué recibes */}
        <Seccion className="bg-[var(--brand-bg-soft)] border-y border-[var(--brand-border)]">
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-medium leading-[1.15]">
                {T.recibesTitulo}
              </h2>
              <ul className="mt-8 space-y-4">
                {T.recibes.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[var(--brand-accent)]/15 text-sm text-[var(--brand-accent-light)]"
                    >
                      ✓
                    </span>
                    <span className="text-white/85 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Vista previa de un resultado real (fase A2) */}
            <figure className="brand-glass rounded-2xl p-6" aria-label={T.ejemploEtiqueta}>
              <figcaption className="text-[11px] font-semibold tracking-[0.15em] uppercase text-white/40">
                {T.ejemploEtiqueta}
              </figcaption>
              <p className="mt-4 text-xs font-semibold text-[var(--brand-accent-light)]">
                {T.ejemploFase}
              </p>
              <div className="brand-progress-track mt-3" aria-hidden="true">
                <div className="brand-progress-fill" style={{ width: "66%" }} />
              </div>
              <p className="font-display mt-5 text-2xl font-medium leading-snug">{T.ejemploTitulo}</p>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">{T.ejemploTexto}</p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
                {COPY.gate.pasosTitulo}
              </p>
              <ul className="mt-3 space-y-2" aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <li
                    key={n}
                    className="flex items-center gap-3 rounded-xl border border-[var(--brand-border)] px-3 py-2.5"
                  >
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-white/20 text-xs text-white/50">
                      {n}
                    </span>
                    <span className="h-2.5 flex-1 rounded-full bg-white/10 blur-[1px]" />
                    <span className="text-xs text-white/40">🔒</span>
                  </li>
                ))}
              </ul>
            </figure>
          </div>
        </Seccion>

        {/* Perfiles por número de propiedades */}
        <Seccion>
          <div className="mx-auto max-w-5xl">
            <Titulo>{T.perfilesTitulo}</Titulo>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[var(--brand-text-muted)] leading-relaxed">
              {T.perfilesIntro}
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {T.perfiles.map((perfil) => (
                <Link
                  key={perfil.nombre}
                  href={HREF}
                  className="brand-option block rounded-2xl p-6"
                >
                  <p className="text-sm font-semibold text-[var(--brand-accent-light)]">
                    {perfil.rango}
                  </p>
                  <p className="font-display mt-2 text-xl font-medium">{perfil.nombre}</p>
                  <p className="mt-2 text-sm text-white/70 leading-relaxed">{perfil.texto}</p>
                </Link>
              ))}
            </div>

            <h3 className="font-display mt-16 text-center text-2xl font-medium">{T.pasosTitulo}</h3>
            <ol className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-3">
              {T.pasos.map((paso, i) => (
                <li key={paso} className="text-center">
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-accent)]/15 font-semibold text-[var(--brand-accent-light)]">
                    {i + 1}
                  </span>
                  <p className="mt-3 text-sm text-white/80 leading-relaxed">{paso}</p>
                </li>
              ))}
            </ol>
          </div>
        </Seccion>

        {/* Preguntas frecuentes */}
        <Seccion className="bg-[var(--brand-bg-soft)] border-y border-[var(--brand-border)]">
          <div className="mx-auto max-w-2xl">
            <Titulo>{T.faqTitulo}</Titulo>
            <div className="mt-10 space-y-3">
              {T.faq.map((item) => (
                <details key={item.p} className="brand-glass group rounded-2xl px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {item.p}
                    <span
                      aria-hidden="true"
                      className="text-[var(--brand-accent-light)] transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-white/75 leading-relaxed">{item.r}</p>
                </details>
              ))}
            </div>
          </div>
        </Seccion>

        {/* Cierre */}
        <Seccion>
          <div className="mx-auto max-w-2xl text-center">
            <Titulo>
              <span className="brand-text-gradient">{T.cierreTitulo}</span>
            </Titulo>
            <p className="mt-4 text-[var(--brand-text-muted)]">{T.cierreTexto}</p>
            <div className="mt-8">
              <BotonDiagnostico texto={T.boton} />
              <p className="mt-4 text-sm text-[var(--brand-text-muted)]">{T.nota}</p>
            </div>
          </div>
        </Seccion>
      </main>

      <footer className="px-4 pb-12 text-center">
        <p className="mx-auto max-w-2xl text-xs text-white/35 leading-relaxed">
          {COPY.avisoLegal}{" "}
          <Link href="/privacidad" className="underline hover:text-white/60">
            Política de privacidad
          </Link>
        </p>
        <div className="mt-6">
          <BadgePlaceholder visible={T.status === "placeholder"} />
        </div>
      </footer>

      {/* CTA fijo en móvil: el botón siempre a un toque */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--brand-border)] bg-[var(--brand-bg)]/90 px-4 py-3 backdrop-blur sm:hidden">
        <BotonDiagnostico texto={T.boton} />
      </div>
    </div>
  );
}
