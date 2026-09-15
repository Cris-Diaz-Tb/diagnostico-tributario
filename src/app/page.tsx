import Link from "next/link";
import type { Viewport } from "next";
import { COPY } from "@/content/copy";
import { CapturaUtm } from "@/components/CapturaUtm";
import { BadgePlaceholder } from "@/components/BadgePlaceholder";
import { BrandBackdrop } from "@/components/brand/BrandBackdrop";

export const viewport: Viewport = { themeColor: "#0A0F16" };

export default function Landing() {
  return (
    <BrandBackdrop
      outerClassName="flex-1"
      innerClassName="flex-1 flex items-center justify-center px-4 py-14 sm:py-20"
    >
      <CapturaUtm />
      <div className="w-full max-w-xl text-center brand-pop-in">
        <p className="text-xs font-semibold tracking-[0.2em] text-white/60 uppercase">
          {COPY.marca.nombre}
        </p>

        <h1 className="font-display mt-6 text-4xl sm:text-5xl font-medium leading-[1.1]">
          <span className="brand-text-gradient">{COPY.landing.titulo}</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-[var(--brand-text-muted)] leading-relaxed">
          {COPY.landing.subtitulo}
        </p>

        <ul className="mt-9 space-y-3 text-left">
          {COPY.landing.bullets.map((bullet, i) => (
            <li
              key={bullet}
              className="brand-glass brand-pop-in flex items-start gap-3 rounded-xl px-4 py-3.5"
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <span className="mt-0.5 flex-none h-6 w-6 rounded-full border border-[var(--brand-accent)]/50 flex items-center justify-center text-[var(--brand-accent-light)] text-xs font-semibold">
                {i + 1}
              </span>
              <span className="text-sm sm:text-base text-white/85 leading-relaxed">{bullet}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <Link
            href="/diagnostico"
            className="brand-btn-cta inline-block w-full sm:w-auto rounded-2xl px-9 py-4 font-semibold text-base"
          >
            {COPY.landing.botonEmpezar}
          </Link>
          <p className="mt-4 text-sm text-[var(--brand-text-muted)]">
            {COPY.landing.notaTiempo}
          </p>
          <p className="mt-2 text-sm text-white/55">{COPY.landing.pruebaSocial}</p>
        </div>

        <p className="mt-12 text-xs text-white/35 leading-relaxed">
          {COPY.avisoLegal}{" "}
          <Link href="/privacidad" className="underline hover:text-white/60">
            Política de privacidad
          </Link>
        </p>

        <div className="mt-6">
          <BadgePlaceholder visible={COPY.status === "placeholder"} />
        </div>
      </div>
    </BrandBackdrop>
  );
}
