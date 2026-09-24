import "server-only";
import { valorConfig } from "@/lib/configuracion";
import type { FaseId } from "@/content/tipos";

/**
 * Agenda propia: al terminar el diagnóstico la persona elige día y hora
 * ella misma. No hay cierre manual por WhatsApp.
 *
 * Es el destino por defecto del botón, así que funciona aunque no haya
 * nada configurado ni en el panel ni en el entorno.
 */
export const URL_AGENDA = "https://cristributario.cl/diagnostico";

/** Hosts de WhatsApp: se rechazan, el cierre ya no pasa por ahí. */
const WHATSAPP = /(^|\.)wa\.me$|(^|\.)whatsapp\.com$/;

/**
 * Enlace del botón "Quiero agendar mi asesoría".
 *
 * Se puede apuntar a otro calendario o a una página de pago desde
 * /admin/configuracion (o con NEXT_PUBLIC_URL_ASESORIA como respaldo).
 * Sea cual sea, se le añaden `diagnostico`, `codigo` y `fase` para cruzar
 * la reserva con las respuestas sin preguntarle nada a la persona.
 *
 * Un enlace de WhatsApp se ignora a propósito: si quedó uno guardado de
 * antes, o alguien lo vuelve a pegar, se agenda igual.
 *
 * Solo devuelve null si la URL configurada no es una URL; ahí el botón
 * cae al Instagram de la marca.
 */
export async function urlAsesoria(
  identificador: string,
  fase?: FaseId | null
): Promise<string | null> {
  const configurada = (await valorConfig("url_asesoria"))?.trim();

  try {
    const url = new URL(configurada || URL_AGENDA);
    if (WHATSAPP.test(url.hostname)) {
      console.warn(
        "[asesoria] Hay un enlace de WhatsApp configurado. Se ignora: el cierre es por agenda."
      );
      return conDatosDelDiagnostico(new URL(URL_AGENDA), identificador, fase);
    }
    return conDatosDelDiagnostico(url, identificador, fase);
  } catch {
    console.warn("[asesoria] La URL de asesoría no es válida, se oculta el enlace.");
    return null;
  }
}

/** Contexto que viaja a la agenda para cruzar la reserva con el diagnóstico. */
function conDatosDelDiagnostico(
  url: URL,
  identificador: string,
  fase?: FaseId | null
): string {
  url.searchParams.set("diagnostico", identificador);
  url.searchParams.set("codigo", codigoCorto(identificador));
  if (fase) url.searchParams.set("fase", fase);
  return url.toString();
}

/** Primeros 8 caracteres del id: suficiente para buscarlo en el panel. */
export function codigoCorto(identificador: string): string {
  return identificador.replace(/^demo-/, "").slice(0, 8).toUpperCase();
}
