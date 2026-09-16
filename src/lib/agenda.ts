import "server-only";
import { COPY } from "@/content/copy";
import { valorConfig } from "@/lib/configuracion";

/**
 * Enlace del botón "Quiero agendar mi asesoría".
 *
 * Se configura en /admin/configuracion (o con NEXT_PUBLIC_URL_ASESORIA
 * como respaldo). Puede ser:
 * - Un enlace de WhatsApp (wa.me o api.whatsapp.com): se prellena el
 *   mensaje con el resultado y un código corto del diagnóstico, para que
 *   el equipo o el agente de GoHighLevel sepa qué respondió la persona.
 * - Cualquier otra URL (página de pago, calendario): se le añade
 *   ?diagnostico=<id> para cruzar la venta con las respuestas.
 *
 * Sin la variable devuelve null y el botón cae al Instagram de la marca.
 */
export async function urlAsesoria(
  identificador: string,
  resultado: string
): Promise<string | null> {
  const base = (await valorConfig("url_asesoria"))?.trim();
  if (!base) return null;

  try {
    const url = new URL(base);
    const esWhatsapp = /(^|\.)wa\.me$|(^|\.)whatsapp\.com$/.test(url.hostname);
    if (esWhatsapp) {
      url.searchParams.set("text", COPY.whatsapp.mensaje(resultado, codigoCorto(identificador)));
    } else {
      url.searchParams.set("diagnostico", identificador);
    }
    return url.toString();
  } catch {
    console.warn("[asesoria] La URL de asesoría no es válida, se oculta el enlace.");
    return null;
  }
}

/** Primeros 8 caracteres del id: suficiente para buscarlo en el panel. */
export function codigoCorto(identificador: string): string {
  return identificador.replace(/^demo-/, "").slice(0, 8).toUpperCase();
}
