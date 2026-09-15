import { NextResponse } from "next/server";
import { z } from "zod";
import { detallarParcial } from "@/lib/scoring";
import { generarToken } from "@/lib/token";
import { getSupabase } from "@/lib/supabase";
import { enviarEventoCapi } from "@/lib/meta-capi";
import { ipDePeticion, permitirSesion } from "@/lib/ratelimit";

/**
 * Guardado progresivo del diagnóstico.
 *
 * Antes la fila se creaba solo al terminar las preguntas, así que quien
 * abandonaba a mitad no dejaba rastro. Ahora la fila nace en la PRIMERA
 * respuesta y se va actualizando: eso es lo que hace medible la tasa de
 * abandono y el perfil de quien abandona.
 *
 * El cliente llama a este endpoint sin esperar la respuesta — si falla,
 * el diagnóstico continúa igual. La medición nunca frena a la persona.
 */

const atribucionSchema = z.object({
  utm: z
    .object({
      source: z.string().max(200).nullish(),
      medium: z.string().max(200).nullish(),
      campaign: z.string().max(200).nullish(),
      content: z.string().max(200).nullish(),
      term: z.string().max(200).nullish(),
    })
    .nullish(),
  referrer: z.string().max(500).nullish(),
  landingPath: z.string().max(300).nullish(),
  clickIds: z
    .object({
      fbclid: z.string().max(500).nullish(),
      gclid: z.string().max(500).nullish(),
      ttclid: z.string().max(500).nullish(),
    })
    .nullish(),
  meta: z
    .object({
      fbp: z.string().max(200).nullish(),
      fbc: z.string().max(500).nullish(),
    })
    .nullish(),
});

const bodySchema = z.object({
  /** Ausente en la primera llamada: ahí es cuando se crea la fila. */
  sesionId: z.string().max(100).nullish(),
  ruta: z.enum(["A", "B", "C"]),
  respuestas: z
    .record(z.string().max(30), z.string().max(60))
    .refine((r) => Object.keys(r).length <= 14, "demasiadas respuestas"),
  // Texto libre: pregunta abierta y detalle de "Otra cosa". El límite
  // real por pregunta lo recorta el scoring; aquí solo se acota el tamaño.
  textos: z
    .record(z.string().max(30), z.string().max(600))
    .refine((t) => Object.keys(t).length <= 4, "demasiados textos")
    .optional(),
  ultimaPregunta: z.string().max(30),
  /** Id base para deduplicar pixel ↔ API de Conversiones. */
  idBase: z.string().min(8).max(100),
  atribucion: atribucionSchema.nullish(),
});

export async function POST(request: Request) {
  const ip = ipDePeticion(request);
  if (!permitirSesion(ip)) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Descarta ids de pregunta/opción que no existan en el catálogo real.
  const parcial = detallarParcial(body.ruta, body.respuestas, body.textos ?? {});
  if (parcial.preguntasRespondidas === 0) {
    return NextResponse.json({ error: "Sin respuestas válidas" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    // Modo demo: el quiz funciona completo, simplemente no se persiste.
    return NextResponse.json({ sesionId: null, demo: true });
  }

  const ahora = new Date().toISOString();

  // ---- Actualización de una sesión ya existente -------------------
  if (body.sesionId) {
    const { data, error } = await supabase
      .from("diagnosticos")
      .update({
        respuestas: parcial.detalle,
        preguntas_respondidas: parcial.preguntasRespondidas,
        ultima_pregunta_id: body.ultimaPregunta,
        ultima_actividad_at: ahora,
      })
      .eq("id", body.sesionId)
      // Nunca revivir una fila ya completada o capturada: si la persona
      // vuelve atrás en el navegador, su resultado no debe degradarse.
      .eq("estado", "iniciado")
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[api/sesion] Error actualizando:", error);
      return NextResponse.json({ error: "Error guardando" }, { status: 500 });
    }
    return NextResponse.json({ sesionId: data?.id ?? body.sesionId });
  }

  // ---- Primera respuesta: nace la fila ----------------------------
  const atrib = body.atribucion;
  const { data, error } = await supabase
    .from("diagnosticos")
    .insert({
      token_resultado: generarToken(),
      estado: "iniciado",
      ruta: body.ruta,
      respuestas: parcial.detalle,
      preguntas_respondidas: parcial.preguntasRespondidas,
      total_preguntas: parcial.totalPreguntas,
      ultima_pregunta_id: body.ultimaPregunta,
      iniciado_at: ahora,
      ultima_actividad_at: ahora,
      evento_id: body.idBase,
      // La atribución se guarda AQUÍ, no al completar: por eso un
      // diagnóstico abandonado también conserva de dónde vino.
      utm_source: atrib?.utm?.source ?? null,
      utm_medium: atrib?.utm?.medium ?? null,
      utm_campaign: atrib?.utm?.campaign ?? null,
      utm_content: atrib?.utm?.content ?? null,
      utm_term: atrib?.utm?.term ?? null,
      referrer: atrib?.referrer ?? null,
      landing_path: atrib?.landingPath ?? null,
      fbclid: atrib?.clickIds?.fbclid ?? null,
      gclid: atrib?.clickIds?.gclid ?? null,
      ttclid: atrib?.clickIds?.ttclid ?? null,
      fbp: atrib?.meta?.fbp ?? null,
      fbc: atrib?.meta?.fbc ?? null,
      // Se guardan para poder enviar el evento de abandono más tarde,
      // cuando el navegador de la persona ya no está disponible.
      client_ip: ip === "desconocida" ? null : ip,
      user_agent: request.headers.get("user-agent"),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[api/sesion] Error creando:", error);
    return NextResponse.json({ error: "Error guardando" }, { status: 500 });
  }

  await enviarEventoCapi({
    evento: "DiagnosticoIniciado",
    idBase: body.idBase,
    persona: {
      fbp: atrib?.meta?.fbp,
      fbc: atrib?.meta?.fbc,
      ip: ip === "desconocida" ? null : ip,
      userAgent: request.headers.get("user-agent"),
    },
    propiedades: {
      ruta: body.ruta,
      utm_source: atrib?.utm?.source,
      utm_campaign: atrib?.utm?.campaign,
      utm_content: atrib?.utm?.content,
    },
    urlOrigen: request.headers.get("referer"),
  });

  return NextResponse.json({ sesionId: data.id });
}
