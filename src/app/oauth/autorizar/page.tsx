import type { Viewport } from "next";
import { BrandBackdrop } from "@/components/brand/BrandBackdrop";
import { llaveMcp } from "@/lib/mcp/oauth";
import { CAMPOS_AUTORIZACION, problemaDelPedido, type PedidoAutorizacion } from "@/lib/mcp/autorizacion";

export const metadata = { title: "Conectar Claude | Cris. Tributario", robots: { index: false } };
export const viewport: Viewport = { themeColor: "#0A0F16" };
export const dynamic = "force-dynamic";

/**
 * Pantalla de autorización del conector de claude.ai. Pide la llave de
 * Claude (MCP_LLAVE), no la del panel. Al aprobar, claude.ai recibe acceso
 * de solo lectura a los diagnósticos.
 */
export default async function Autorizar({
  searchParams,
}: {
  searchParams: Promise<PedidoAutorizacion & { error?: string }>;
}) {
  const params = await searchParams;
  const pedido: PedidoAutorizacion = Object.fromEntries(
    CAMPOS_AUTORIZACION.map((c) => [c, typeof params[c] === "string" ? params[c] : undefined])
  );
  const problema = llaveMcp() ? problemaDelPedido(pedido) : "El conector no está configurado (falta MCP_LLAVE).";

  return (
    <BrandBackdrop outerClassName="flex-1" innerClassName="flex-1 flex items-center justify-center px-5">
      <div className="brand-glass brand-pop-in w-full max-w-sm rounded-3xl p-7 space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-widest text-white/60 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-accent)] shadow-[0_0_8px_var(--brand-accent)]" />
          Conector de Claude
        </span>
        <h1 className="font-display text-lg font-bold text-white">Dar acceso a los diagnósticos</h1>

        {problema ? (
          <p className="text-sm text-red-400">No se puede autorizar: {problema}</p>
        ) : (
          <form action="/api/oauth/aprobar" method="post" className="space-y-4">
            <p className="text-sm text-white/60 leading-relaxed">
              Claude podrá <strong className="text-white/85">leer</strong> todos los diagnósticos
              (directo y lanzamientos), con nombre, email y teléfono. No puede cambiar ni
              borrar nada. El acceso dura hasta que se cambie la llave.
            </p>
            {CAMPOS_AUTORIZACION.map((c) =>
              pedido[c] ? <input key={c} type="hidden" name={c} value={pedido[c]} /> : null
            )}
            <input
              type="password"
              name="llave"
              placeholder="Llave de Claude (MCP_LLAVE)"
              required
              autoFocus
              autoComplete="off"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-[var(--brand-accent)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/25 transition"
            />
            {params.error === "limite" ? (
              <p className="text-sm text-red-400">Demasiados intentos. Espera un minuto.</p>
            ) : params.error ? (
              <p className="text-sm text-red-400">Llave incorrecta.</p>
            ) : null}
            <div className="flex gap-3">
              <button
                type="submit"
                name="decision"
                value="aprobar"
                className="brand-btn-cta font-display flex-1 rounded-xl px-4 py-3 text-white font-bold"
              >
                Autorizar
              </button>
              <button
                type="submit"
                name="decision"
                value="rechazar"
                formNoValidate
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/70 hover:text-white transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </BrandBackdrop>
  );
}
