import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la SERVICE ROLE KEY — solo puede usarse en
 * servidor (API routes / Server Components). El import de "server-only"
 * hace que el build falle si alguien lo importa desde un client component.
 *
 * Devuelve null si las env vars no están configuradas → la app corre
 * en "modo demo" (el quiz funciona pero no persiste).
 */

let cliente: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cliente !== undefined) return cliente;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn(
      "[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configuradas — modo demo activo, los diagnósticos no se guardan."
    );
    cliente = null;
    return cliente;
  }

  cliente = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}

export function modoDemo(): boolean {
  return getSupabase() === null;
}
