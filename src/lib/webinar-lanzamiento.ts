import "server-only";
import { valorConfig } from "@/lib/configuracion";

/**
 * Enlace del botón "webinar" en el resultado de un lanzamiento. Se edita
 * en /admin/configuracion (o NEXT_PUBLIC_URL_WEBINAR como respaldo).
 * null si no hay enlace o no es una URL http(s): el resultado muestra la
 * invitación sin botón.
 */
export async function urlWebinarLanzamiento(): Promise<string | null> {
  const configurada = (await valorConfig("url_webinar"))?.trim();
  if (!configurada) return null;
  try {
    const url = new URL(configurada);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    console.warn("[webinar] La URL del webinar no es válida, se oculta el botón.");
    return null;
  }
}
