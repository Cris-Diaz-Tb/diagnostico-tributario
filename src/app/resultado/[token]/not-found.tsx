import Link from "next/link";
import { COPY } from "@/content/copy";
import { BrandBackdrop } from "@/components/brand/BrandBackdrop";

export default function ResultadoNoEncontrado() {
  return (
    <BrandBackdrop
      outerClassName="flex-1"
      innerClassName="flex-1 flex items-center justify-center px-5 py-12"
    >
      <div className="brand-glass brand-pop-in w-full max-w-md rounded-3xl p-8 text-center">        <h1 className="font-display text-2xl font-bold">
          {COPY.errores.resultadoNoEncontrado}
        </h1>
        <p className="mt-3 text-white/70 leading-relaxed">
          {COPY.errores.resultadoNoEncontradoDetalle}
        </p>
        <Link
          href="/diagnostico"
          className="brand-btn-cta font-display mt-8 inline-block rounded-2xl px-7 py-3.5 text-white font-bold"
        >
          {COPY.errores.volverAlInicio}
        </Link>
      </div>
    </BrandBackdrop>
  );
}
