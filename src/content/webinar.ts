/**
 * Tercer botón del resultado: invitación a la clase en vivo.
 *
 * Queda construido pero apagado. Para activarlo: pegar la URL de registro
 * y cambiar el flag a true. Sin una URL válida no se muestra aunque el
 * flag esté encendido.
 */
export const MOSTRAR_CTA_WEBINAR = false;
export const URL_REGISTRO_WEBINAR = "";

/** URL lista para el botón, o null si el CTA no debe mostrarse. */
export function urlWebinarActiva(): string | null {
  if (!MOSTRAR_CTA_WEBINAR) return null;
  try {
    return new URL(URL_REGISTRO_WEBINAR).toString();
  } catch {
    return null;
  }
}
