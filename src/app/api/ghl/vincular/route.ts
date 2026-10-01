import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getSupabase } from "@/lib/supabase";
import { vincularContactoWhatsapp } from "@/lib/crm";
import { COLUMNAS_LEAD, leadDesdeFila, type FilaLead } from "@/lib/lead-diagnostico";
import { extraerCodigo } from "@/lib/whatsapp";
import { ipDePeticion, permitirPeticion } from "@/lib/ratelimit";

/**
 * Webhook que llama un workflow de GoHighLevel cuando alguien escribe por
 * WhatsApp citando su código de diagnóstico.
 *
 * Busca el diagnóstico por código y escribe en ESE contacto de GHL los
 * campos que lee el bot (contexto, etapa, enlace de agenda), las
 * etiquetas y la oportunidad. Así el bot tiene el contexto aunque la
 * persona escriba desde otro número que el que dejó en el diagnóstico.
 *
 * Autenticación: secreto compartido GHL_WEBHOOK_SECRET, en el header
 * `x-webhook-secret` o en `?secreto=` (la acción Webhook estándar de GHL
 * no siempre permite headers).
 *
 * Cuerpo aceptado (el de la acción Webhook de GHL u otro a mano):
 *   { contact_id | contactId, message: { body } | message | mensaje | codigo }
 *
 * Responde 200 aunque no encuentre el código: así GHL no reintenta, y el
 * bot pide el correo para identificar a la persona.
 */

export async function POST(request: Request) {
  if (!permitirPeticion(ipDePeticion(request), { limite: 60, ambito: "ghl" })) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  const secreto = process.env.GHL_WEBHOOK_SECRET?.trim();
  if (!secreto) {
    console.warn("[ghl/vincular] GHL_WEBHOOK_SECRET no configurado: endpoint deshabilitado.");
    return NextResponse.json({ error: "No configurado" }, { status: 503 });
  }
  const recibido =
    request.headers.get("x-webhook-secret") ?? new URL(request.url).searchParams.get("secreto");
  if (!recibido || !mismoSecreto(recibido, secreto)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const contactId = texto(cuerpo.contact_id) ?? texto(cuerpo.contactId);
  if (!contactId || contactId.length > 100) {
    return NextResponse.json({ error: "Falta contact_id" }, { status: 400 });
  }

  const mensaje =
    texto(cuerpo.codigo) ??
    texto(cuerpo.mensaje) ??
    texto(cuerpo.message) ??
    texto((cuerpo.message as { body?: unknown } | undefined)?.body) ??
    "";
  const codigo = extraerCodigo(mensaje.slice(0, 2000));
  if (!codigo) return NextResponse.json({ vinculado: false, motivo: "sin_codigo" });

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 });
  }

  // Solo diagnósticos con fase: los abandonados a medias no tienen resultado.
  const { data, error } = await supabase
    .from("diagnosticos")
    .select(COLUMNAS_LEAD)
    .eq("codigo", codigo)
    .not("fase", "is", null)
    .order("fecha_creacion", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[ghl/vincular] Error buscando el código:", error);
    return NextResponse.json({ error: "Error de base de datos" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ vinculado: false, motivo: "codigo_no_encontrado", codigo });

  const fila = data as unknown as FilaLead;
  const lead = await leadDesdeFila(fila);
  const { vinculado } = await vincularContactoWhatsapp(contactId, lead);

  await supabase
    .from("diagnosticos")
    .update({ whatsapp_iniciado_at: new Date().toISOString() })
    .eq("id", fila.id)
    .is("whatsapp_iniciado_at", null);

  return NextResponse.json({ vinculado, codigo, fase: lead.fase });
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

function mismoSecreto(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
