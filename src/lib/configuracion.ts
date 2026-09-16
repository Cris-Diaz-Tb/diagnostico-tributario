import "server-only";
import { getSupabase } from "@/lib/supabase";

/**
 * Configuración editable desde /admin/configuracion.
 *
 * Orden de resolución de cada ajuste:
 *   1. Lo guardado en la tabla `configuracion` (lo que edita Cris).
 *   2. La variable de entorno equivalente (respaldo, y lo que ya existía).
 *
 * Así el panel manda, pero nada se rompe si la tabla está vacía o si
 * todavía no se corrió la migración 002.
 */

export type ClaveConfig =
  | "meta_pixel_id"
  | "meta_capi_token"
  | "meta_test_event_code"
  | "meta_api_version"
  | "url_asesoria";

export const CLAVES: ClaveConfig[] = [
  "meta_pixel_id",
  "meta_capi_token",
  "meta_test_event_code",
  "meta_api_version",
  "url_asesoria",
];

/** Variable de entorno que respalda a cada clave. */
const ENV_DE_CLAVE: Record<ClaveConfig, string[]> = {
  meta_pixel_id: ["META_PIXEL_ID", "NEXT_PUBLIC_META_PIXEL_ID"],
  meta_capi_token: ["META_CAPI_TOKEN"],
  meta_test_event_code: ["META_TEST_EVENT_CODE"],
  meta_api_version: ["META_API_VERSION"],
  url_asesoria: ["NEXT_PUBLIC_URL_ASESORIA"],
};

export type Configuracion = Partial<Record<ClaveConfig, string>>;

/**
 * Caché en memoria. En serverless cada instancia tiene la suya, por eso
 * la ventana es corta: un cambio en el panel se propaga en menos de un
 * minuto sin necesidad de volver a desplegar.
 */
const TTL_MS = 30_000;
let cache: { valores: Configuracion; expira: number } | null = null;

export function invalidarCacheConfig(): void {
  cache = null;
}

/** Lee la tabla completa. Si no hay base de datos, devuelve vacío. */
export async function leerConfiguracion(): Promise<Configuracion> {
  if (cache && cache.expira > Date.now()) return cache.valores;

  const supabase = getSupabase();
  if (!supabase) {
    cache = { valores: {}, expira: Date.now() + TTL_MS };
    return cache.valores;
  }

  const { data, error } = await supabase.from("configuracion").select("clave, valor");

  if (error) {
    // La migración 002 puede no estar corrida todavía: se sigue con el entorno.
    console.warn("[configuracion] No se pudo leer la tabla:", error.message);
    cache = { valores: {}, expira: Date.now() + TTL_MS };
    return cache.valores;
  }

  const valores: Configuracion = {};
  for (const fila of data ?? []) {
    const clave = fila.clave as ClaveConfig;
    const valor = (fila.valor as string | null)?.trim();
    if (valor) valores[clave] = valor;
  }

  cache = { valores, expira: Date.now() + TTL_MS };
  return valores;
}

/** Valor efectivo de una clave: panel primero, entorno como respaldo. */
export async function valorConfig(clave: ClaveConfig): Promise<string | undefined> {
  const valores = await leerConfiguracion();
  if (valores[clave]) return valores[clave];
  return valorDeEntorno(clave);
}

export function valorDeEntorno(clave: ClaveConfig): string | undefined {
  for (const nombre of ENV_DE_CLAVE[clave]) {
    const valor = process.env[nombre]?.trim();
    if (valor) return valor;
  }
  return undefined;
}

/**
 * Guarda los cambios. Una clave con cadena vacía se borra, para poder
 * volver a depender de la variable de entorno.
 */
export async function guardarConfiguracion(
  cambios: Configuracion
): Promise<{ guardado: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { guardado: false, error: "Base de datos no disponible" };

  const aGuardar: Array<{ clave: string; valor: string; actualizado_at: string }> = [];
  const aBorrar: string[] = [];
  const ahora = new Date().toISOString();

  for (const clave of CLAVES) {
    const valor = cambios[clave];
    if (valor === undefined) continue; // no se tocó
    const limpio = valor.trim();
    if (limpio) aGuardar.push({ clave, valor: limpio, actualizado_at: ahora });
    else aBorrar.push(clave);
  }

  if (aGuardar.length > 0) {
    const { error } = await supabase
      .from("configuracion")
      .upsert(aGuardar, { onConflict: "clave" });
    if (error) return { guardado: false, error: error.message };
  }

  if (aBorrar.length > 0) {
    const { error } = await supabase.from("configuracion").delete().in("clave", aBorrar);
    if (error) return { guardado: false, error: error.message };
  }

  invalidarCacheConfig();
  return { guardado: true };
}

/** Deja ver que hay un secreto guardado sin revelarlo. */
export function enmascarar(valor: string | undefined): string {
  if (!valor) return "";
  if (valor.length <= 8) return "••••";
  return `${"•".repeat(12)}${valor.slice(-4)}`;
}

/** De dónde sale hoy cada valor: del panel, del entorno, o de ningún lado. */
export async function origenDeClave(
  clave: ClaveConfig
): Promise<"panel" | "entorno" | "sin_configurar"> {
  const valores = await leerConfiguracion();
  if (valores[clave]) return "panel";
  if (valorDeEntorno(clave)) return "entorno";
  return "sin_configurar";
}
