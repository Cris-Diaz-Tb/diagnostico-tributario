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
 * variables GHL_CAMPO_* (contacto) y GHL_CAMPO_OPP_* (oportunidad),
 * también se rellenan. El bot de WhatsApp lee los del contacto; los de
 * la oportunidad son los que se ven en la carpeta "Diagnóstico".
 *
 * Oportunidad: si está GHL_PIPELINE_DIAGNOSTICO, se crea o actualiza una
 * por contacto en ese pipeline.
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
  /** Datos legibles para los campos personalizados y el bot. */
  datos?: DatosDiagnosticoCrm;
}

/** Lo que se escribe en los campos personalizados (contacto y oportunidad). */
export interface DatosDiagnosticoCrm {
  codigo: string;
  /** "Inversionista inicial, etapa 2 de 3 (A2)" */
  etapa: string;
  problemaTexto: string;
  intencionTexto: string;
  ofertaNombre: string;
  urlAgenda: string | null;
  contexto: string;
}

const API = "https://services.leadconnectorhq.com";

/** Valor de la oportunidad: el acompañamiento único que cierra el bot. */
export const VALOR_OPORTUNIDAD_CLP = 230000;

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

type CampoGhl = { id: string; field_value: string };

function campos(mapa: Array<[string | undefined, string | null | undefined]>): CampoGhl[] {
  return mapa
    .filter(([id, valor]) => Boolean(id?.trim()) && valor !== undefined && valor !== null)
    .map(([id, valor]) => ({ id: id!.trim(), field_value: valor! }));
}

export function camposDeContacto(lead: LeadParaCrm): CampoGhl[] {
  const e = process.env;
  return campos([
    [e.GHL_CAMPO_FASE, lead.fase],
    [e.GHL_CAMPO_SCORE, String(lead.score)],
    [e.GHL_CAMPO_OFERTA, lead.datos?.ofertaNombre ?? lead.oferta],
    [e.GHL_CAMPO_PROBLEMA, lead.datos?.problemaTexto ?? lead.problema ?? ""],
    [e.GHL_CAMPO_URL_RESULTADO, lead.urlResultado],
    [e.GHL_CAMPO_CODIGO, lead.datos?.codigo],
    [e.GHL_CAMPO_ETAPA, lead.datos?.etapa],
    [e.GHL_CAMPO_URL_AGENDA, lead.datos?.urlAgenda],
    [e.GHL_CAMPO_CONTEXTO, lead.datos?.contexto],
  ]);
}

export function camposDeOportunidad(lead: LeadParaCrm): CampoGhl[] {
  const e = process.env;
  return campos([
    [e.GHL_CAMPO_OPP_CODIGO, lead.datos?.codigo],
    [e.GHL_CAMPO_OPP_ETAPA, lead.datos?.etapa],
    [e.GHL_CAMPO_OPP_SCORE, String(lead.score)],
    [e.GHL_CAMPO_OPP_PROBLEMA, lead.datos?.problemaTexto],
    [e.GHL_CAMPO_OPP_INTENCION, lead.datos?.intencionTexto],
    [e.GHL_CAMPO_OPP_OFERTA, lead.datos?.ofertaNombre],
    [e.GHL_CAMPO_OPP_URL_RESULTADO, lead.urlResultado],
    [e.GHL_CAMPO_OPP_CONTEXTO, lead.datos?.contexto],
  ]);
}

function credenciales(): { token: string; locationId: string } | null {
  const token = process.env.GHL_API_TOKEN?.trim();
  const locationId = process.env.GHL_LOCATION_ID?.trim();
  return token && locationId ? { token, locationId } : null;
}

/** Llamada a la API de GHL. Devuelve el JSON, o null si falló (queda log). */
async function llamarGhl(
  ruta: string,
  metodo: "POST" | "PUT",
  cuerpo: unknown,
  token: string
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${API}${ruta}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(cuerpo),
    });
    if (!res.ok) {
      const detalle = await res.text();
      console.error(`[crm] GoHighLevel ${metodo} ${ruta} respondió ${res.status}: ${detalle.slice(0, 300)}`);
      return null;
    }
    return (await res.json().catch(() => ({}))) as Record<string, unknown>;
  } catch (err) {
    console.error(`[crm] Fallo llamando a GoHighLevel ${metodo} ${ruta}:`, err);
    return null;
  }
}

/**
 * Crea o actualiza la oportunidad del diagnóstico en su pipeline.
 * `etapa` elige la columna: completado al capturar, WhatsApp al vincular.
 */
async function upsertOportunidad(
  lead: LeadParaCrm,
  contactId: string,
  etapa: "completado" | "whatsapp",
  { token, locationId }: { token: string; locationId: string }
): Promise<boolean> {
  const pipelineId = process.env.GHL_PIPELINE_DIAGNOSTICO?.trim();
  const etapaId = (
    etapa === "whatsapp" ? process.env.GHL_ETAPA_WHATSAPP : process.env.GHL_ETAPA_COMPLETADO
  )?.trim();
  if (!pipelineId || !etapaId) return false;

  const camposOpp = camposDeOportunidad(lead);
  const res = await llamarGhl(
    "/opportunities/upsert",
    "POST",
    {
      locationId,
      pipelineId,
      pipelineStageId: etapaId,
      contactId,
      name: `${lead.nombre} · Diagnóstico ${lead.fase}`,
      status: "open",
      monetaryValue: VALOR_OPORTUNIDAD_CLP,
      ...(camposOpp.length > 0 ? { customFields: camposOpp } : {}),
    },
    token
  );
  return res !== null;
}

export async function sincronizarLeadConCrm(
  lead: LeadParaCrm
): Promise<{ sincronizado: boolean }> {
  const cred = credenciales();
  if (!cred) {
    console.warn(
      `[crm] GHL_API_TOKEN/GHL_LOCATION_ID no configuradas: lead ${lead.email} no sincronizado (queda solo en Supabase).`
    );
    return { sincronizado: false };
  }

  const camposContacto = camposDeContacto(lead);
  const res = await llamarGhl(
    "/contacts/upsert",
    "POST",
    {
      locationId: cred.locationId,
      name: lead.nombre,
      email: lead.email,
      phone: lead.telefono ?? undefined,
      source: "Diagnóstico web",
      tags: etiquetasDeLead(lead),
      ...(camposContacto.length > 0 ? { customFields: camposContacto } : {}),
    },
    cred.token
  );
  if (!res) return { sincronizado: false };

  const contactId = (res.contact as { id?: string } | undefined)?.id;
  if (contactId) await upsertOportunidad(lead, contactId, "completado", cred);

  return { sincronizado: true };
}

/**
 * Escribe el diagnóstico en un contacto que ya existe en GHL: el que
 * escribió por WhatsApp. Cubre a quien escribe desde otro número que el
 * que dejó en el diagnóstico (GHL lo ve como contacto distinto).
 *
 * No toca nombre, email ni teléfono del contacto: solo campos, etiquetas
 * y la oportunidad, que pasa a la etapa de consulta por WhatsApp.
 */
export async function vincularContactoWhatsapp(
  contactId: string,
  lead: LeadParaCrm
): Promise<{ vinculado: boolean }> {
  const cred = credenciales();
  if (!cred) {
    console.warn("[crm] GHL_API_TOKEN/GHL_LOCATION_ID no configuradas: no se vinculó el WhatsApp.");
    return { vinculado: false };
  }

  const id = encodeURIComponent(contactId);
  const camposContacto = camposDeContacto(lead);
  const [actualizado, etiquetado] = await Promise.all([
    camposContacto.length > 0
      ? llamarGhl(`/contacts/${id}`, "PUT", { customFields: camposContacto }, cred.token)
      : Promise.resolve({}),
    // POST de etiquetas: suma sin borrar las que ya tenía (un PUT las reemplaza).
    llamarGhl(
      `/contacts/${id}/tags`,
      "POST",
      { tags: [...etiquetasDeLead(lead), "diag-whatsapp"] },
      cred.token
    ),
  ]);
  await upsertOportunidad(lead, contactId, "whatsapp", cred);

  return { vinculado: actualizado !== null && etiquetado !== null };
}
