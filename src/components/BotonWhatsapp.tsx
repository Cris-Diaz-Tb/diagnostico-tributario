"use client";

import { trackEvento } from "@/lib/analytics";
import type { FaseId } from "@/content/tipos";

/** Botón secundario del resultado: abre el chat con el mensaje prellenado. */
export function BotonWhatsapp({
  href,
  fase,
  texto,
}: {
  href: string;
  fase: FaseId;
  texto: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvento("whatsapp_click", { fase })}
      className="mt-3 inline-block w-full sm:w-auto rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white/85 hover:border-[var(--brand-accent)]/50 hover:text-white transition"
    >
      {texto}
    </a>
  );
}
