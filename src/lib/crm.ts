import "server-only";
import type { FaseId, OfertaId, Ruta } from "@/content/tipos";

/**
 * Sincronización de leads con GoHighLevel (el CRM de Cris).
 *
 * Al capturar el email, el contacto se crea o actualiza en la subcuenta
 * con etiquetas que describen su diagnóstico. Los workflows de GHL
 * (secuencia de correos, WhatsApp, agente de IA, pipeline) se disparan
 * por esas etiquetas.
 *
 * Etiquetas: diagnostico · diag-ruta-a · diag-fase-a2 ·
 * diag-oferta-asesoria_patrimonial · diag-problema-herencia ·
 * diag-intencion-nada
 *
 * Campos personalizados: opcionales. Si se definen los ids en las
 * variables GHL_CAMPO_*, también se rellenan.
 *
 * Sin GHL_API_TOKEN o GHL_LOCATION_ID no hace nada (queda log). Un fallo
 * del CRM nunca rompe el flujo: el lead ya está guardado en Supabase.
 */

export interface LeadParaCrm {
  email: string;
  nombre: string;
  telefono: string | null;
  ruta: Ruta;
  fase: FaseId;
  score: number;
  problema: string | null;
  nivelIntencion: string | null;
  oferta: OfertaId;
  urlResultado: string;
}

const API_GHL = "https://services.leadconnectorhq.com/contacts/upsert";

export function etiquetasDeLead(lead: LeadParaCrm): string[] {
  return [
    "diagnostico",
    `diag-ruta-${lead.ruta.toLowerCase()}`,
    `diag-fase-${lead.fase.toLowerCase()}`,
    `diag-oferta-${lead.oferta}`,
    lead.problema ? `diag-problema-${lead.problema}` : null,
    lead.nivelIntencion ? `diag-intencion-${lead.nivelIntencion}` : null,
  ].filter((e): e is string => Boolean(e));
}

function camposPersonalizados(lead: LeadParaCrm) {
  const mapa: Array<[string | undefined, string]> = [
    [process.env.GHL_CAMPO_FASE, lead.fase],
    [process.env.GHL_CAMPO_SCORE, String(lead.score)],
    [process.env.GHL_CAMPO_OFERTA, lead.oferta],
    [process.env.GHL_CAMPO_PROBLEMA, lead.problema ?? ""],
    [process.env.GHL_CAMPO_URL_RESULTADO, lead.urlResultado],
  ];
  return mapa
    .filter(([id]) => Boolean(id?.trim()))
    .map(([id, valor]) => ({ id: id!.trim(), field_value: valor }));
}

export async function sincronizarLeadConCrm(
  lead: LeadParaCrm
): Promise<{ sincronizado: boolean }> {
  const token = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) {
    console.warn(
      `[crm] GHL_API_TOKEN/GHL_LOCATION_ID no configuradas: lead ${lead.email} no sincronizado (queda solo en Supabase).`
    );
    return { sincronizado: false };
  }

  const campos = camposPersonalizados(lead);

  try {
    const res = await fetch(API_GHL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        locationId,
        name: lead.nombre,
        email: lead.email,
        phone: lead.telefono ?? undefined,
        source: "Diagnóstico web",
        tags: etiquetasDeLead(lead),
        ...(campos.length > 0 ? { customFields: campos } : {}),
      }),
    });

    if (!res.ok) {
      const detalle = await res.text();
      console.error(`[crm] GoHighLevel respondió ${res.status}: ${detalle.slice(0, 300)}`);
      return { sincronizado: false };
    }
    return { sincronizado: true };
  } catch (err) {
    console.error("[crm] Fallo sincronizando con GoHighLevel:", err);
    return { sincronizado: false };
  }
}
