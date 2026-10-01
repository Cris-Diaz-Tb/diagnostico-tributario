import "server-only";
import { codigoCorto, urlAsesoria } from "@/lib/agenda";
import { contextoParaBot } from "@/lib/contexto-diagnostico";
import type { LeadParaCrm } from "@/lib/crm";
import type { RespuestaDetallada } from "@/lib/scoring";
import { ofertaRecomendada } from "@/content/ofertas";
import { etapaDeFase } from "@/content/roadmaps";
import { NOMBRE_RUTA, TEXTO_INTENCION, TEXTO_PROBLEMA } from "@/content/preguntas";
import type { FaseId, Ruta } from "@/content/tipos";

/**
 * Arma el lead para GoHighLevel a partir de una fila de `diagnosticos`.
 * Lo usan la captura del email y la vinculación desde WhatsApp, así los
 * dos caminos escriben exactamente los mismos datos en el CRM.
 */

/** Columnas que necesita `leadDesdeFila`. */
export const COLUMNAS_LEAD =
  "id, token_resultado, nombre, email, telefono, ruta, fase, score_numerico, problema_principal, problema_otro, nivel_intencion, texto_abierto, respuestas";

export interface FilaLead {
  id: string;
  token_resultado: string;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  ruta: string;
  fase: string;
  score_numerico: number | null;
  problema_principal: string | null;
  problema_otro: string | null;
  nivel_intencion: string | null;
  texto_abierto: string | null;
  respuestas: RespuestaDetallada[] | null;
}

export async function leadDesdeFila(fila: FilaLead): Promise<LeadParaCrm> {
  const fase = fila.fase as FaseId;
  const ruta = fila.ruta as Ruta;
  const problema = fila.problema_principal;
  const oferta = ofertaRecomendada(fase, problema);
  const codigo = codigoCorto(fila.id);

  const urlAgenda = await urlAsesoria(fila.id, fase);
  // Marca las reservas que llegan desde la conversación del bot.
  const urlAgendaBot = urlAgenda ? conCanal(urlAgenda, "whatsapp") : null;

  return {
    email: fila.email ?? "",
    nombre: fila.nombre ?? "",
    telefono: fila.telefono,
    ruta,
    fase,
    score: fila.score_numerico ?? 0,
    problema,
    nivelIntencion: fila.nivel_intencion,
    oferta: oferta.id,
    urlResultado: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/resultado/${fila.token_resultado}`,
    datos: {
      codigo,
      etapa: `${NOMBRE_RUTA[ruta]}, etapa ${etapaDeFase(fase)} de 3 (${fase})`,
      problemaTexto: problema
        ? [TEXTO_PROBLEMA[problema] ?? problema, fila.problema_otro].filter(Boolean).join(": ")
        : "",
      intencionTexto: fila.nivel_intencion
        ? (TEXTO_INTENCION[fila.nivel_intencion] ?? fila.nivel_intencion)
        : "",
      ofertaNombre: oferta.nombre,
      urlAgenda: urlAgendaBot,
      contexto: contextoParaBot({
        codigo,
        nombre: fila.nombre,
        fase,
        score: fila.score_numerico,
        problema,
        problemaOtro: fila.problema_otro,
        nivelIntencion: fila.nivel_intencion,
        textoAbierto: fila.texto_abierto,
        respuestas: fila.respuestas,
      }),
    },
  };
}

function conCanal(url: string, canal: string): string {
  const u = new URL(url);
  u.searchParams.set("canal", canal);
  return u.toString();
}
