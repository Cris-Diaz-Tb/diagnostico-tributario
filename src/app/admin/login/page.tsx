import { redirect } from "next/navigation";
import type { Viewport } from "next";
import { esAdmin } from "@/lib/admin-auth";
import { BrandBackdrop } from "@/components/brand/BrandBackdrop";
import { loginAdmin } from "../actions";

export const metadata = { title: "Admin | Cris. Tributario" };
export const viewport: Viewport = { themeColor: "#0A0F16" };

export default async function LoginAdmin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await esAdmin()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <BrandBackdrop
      outerClassName="flex-1"
      innerClassName="flex-1 flex items-center justify-center px-5"
    >
      <form
        action={loginAdmin}
        className="brand-glass brand-pop-in w-full max-w-xs rounded-3xl p-7 space-y-4"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-widest text-white/60 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-accent)] shadow-[0_0_8px_var(--brand-accent)]" />
          Acceso restringido
        </span>
        <h1 className="font-display text-lg font-bold text-white">Panel interno</h1>
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          autoFocus
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-[var(--brand-accent)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/25 transition"
        />
        {error === "limite" ? (
          <p className="text-sm text-red-400">
            Demasiados intentos. Espera un minuto y vuelve a intentar.
          </p>
        ) : error ? (
          <p className="text-sm text-red-400">Password incorrecta.</p>
        ) : null}
        <button
          type="submit"
          className="brand-btn-cta font-display w-full rounded-xl px-4 py-3 text-white font-bold"
        >
          Entrar
        </button>
      </form>
    </BrandBackdrop>
  );
}
