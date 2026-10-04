import "server-only";
import { cookies } from "next/headers";
import { origenValido, type OrigenId } from "@/content/origenes";

/**
 * Espacio de datos que está mirando el panel (directo o un lanzamiento).
 * Se guarda en una cookie para que la elección se mantenga al cambiar de
 * pestaña y en las exportaciones, sin pasar un parámetro por cada link.
 */
export const COOKIE_ESPACIO = "dd_espacio";

export async function espacioActivo(): Promise<OrigenId> {
  return origenValido((await cookies()).get(COOKIE_ESPACIO)?.value);
}
