import "server-only";
import { valorConfig } from "@/lib/configuracion";
import { codigoCorto } from "@/lib/agenda";
import { digitosDeTelefono } from "@/lib/telefono";
import { etapaDeFase } from "@/content/roadmaps";
import { NOMBRE_RUTA } from "@/content/preguntas";
import { COPY } from "@/content/copy";
import type { FaseId, Ruta } from "@/content/tipos";

/**
 * Canal de consulta por WhatsApp, alternativo a la agenda.
 *
 * El botón abre el chat con Cris con un mensaje prellenado que trae la
 * etapa y el código del diagnóstico. Del otro lado, el bot de GoHighLevel
 * reconoce a la persona por su teléfono (es obligatorio en el gate) y,
 * como respaldo, GHL manda el mensaje a /api/ghl/vincular para cruzar el
 * código con el diagnóstico.
 *
 * Sin número configurado (panel o WHATSAPP_NUMERO) el botón no aparece.
 */

export function mensajeWhatsapp(fase: FaseId, codigo: string): string {
  const ruta = fase[0] as Ruta;
  return COPY.whatsapp.mensaje(NOMBRE_RUTA[ruta], etapaDeFase(fase), fase, codigo);
}

export async function urlWhatsapp(
  identificador: string,
  fase: FaseId
): Promise<string | null> {
  const numero = digitosDeTelefono((await valorConfig("whatsapp_numero")) ?? "");
  if (numero.length < 8) return null;
  const texto = mensajeWhatsapp(fase, codigoCorto(identificador));
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

/**
 * Saca el código del mensaje que escribió la persona. Primero busca el
 * que viene después de "código" (el mensaje prellenado); si lo editó,
 * cualquier palabra suelta de 8 caracteres hexadecimales. Un falso
 * positivo es inocuo: simplemente no existe en la base.
 */
export function extraerCodigo(mensaje: string): string | null {
  const tras = mensaje.match(/c[oó]digo\D{0,12}?\b([0-9a-f]{8})\b/i);
  if (tras) return tras[1].toUpperCase();
  const suelto = mensaje.match(/\b([0-9a-f]{8})\b/i);
  return suelto ? suelto[1].toUpperCase() : null;
}
