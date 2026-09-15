import { COPY } from "@/content/copy";

/**
 * Badge visible mientras un texto sea provisional (status: "placeholder").
 * Se apaga globalmente con NEXT_PUBLIC_SHOW_PLACEHOLDER_BADGE=false.
 */
export function BadgePlaceholder({ visible }: { visible: boolean }) {
  if (!visible) return null;
  if (process.env.NEXT_PUBLIC_SHOW_PLACEHOLDER_BADGE === "false") return null;
  return (
    <span className="inline-block rounded-full bg-amber-400/10 text-amber-300 text-[11px] font-medium px-2.5 py-0.5 border border-amber-400/30">
      {COPY.placeholderBadge}
    </span>
  );
}
