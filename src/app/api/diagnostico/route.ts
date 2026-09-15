import { NextResponse } from "next/server";
import { z } from "zod";
import { calcularResultado, RespuestasInvalidasError } from "@/lib/scoring";
import { preguntasDeRuta, VERSION_CUESTIONARIO } from "@/content/preguntas";
import { ofertaRecomendada } from "@/content/ofertas";
import { generarToken } from "@/lib/token";
import { getSupabase } from "@/lib/supabase";
import { enviarEventoCapi } from "@/lib/meta-capi";
import { ipDePeticion, permitirPeticion } from "@/lib/ratelimit";

const bodySchema = z.object({
  ruta: z.enum(["A", "B", "C"]),
  // Claves y valores acotados (los ids reales miden <15 chars) y máximo
  // 12 entradas (la ruta más larga tiene 9 preguntas) — evita payloads
  // basura de gran tamaño.
  respuestas: z
    .record(z.string().max(30), z.string().max(60))
    .refine((r) => Object.keys(r).length <= 14, "demasiadas respuestas"),
  textos: z
    .record(z.string().max(30), z.string().max(600))
    .refine((t) => Object.keys(t).length <= 4, "demasiados textos")
    .optional(),
  /** Sesión creada al responder la primera pregunta (guardado progresivo). */
  sesionId: z.string().max(100).nullish(),
  idBase: z.string().min(8).max(100),
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
  meta: z
    .object({
      fbp: z.string().max(200).nullish(),
      fbc: z.string().max(500).nullish(),
    })
    .nullish(),
  // Honeypot: los humanos nunca ven este campo; si viene lleno, es un bot.
  website: z.string().optional(),
});

/** Columnas que necesita la API de Conversiones para armar el evento. */
const COLUMNAS_CAPI = "id, fbp, fbc, client_ip, user_agent";

/**
 * Se llama al COMPLETAR el quiz (antes de capturar el email).
 *
 * Normalmente ya existe una fila creada por /api/diagnostico/sesion en la
 * primera respuesta: aquí solo se marca como completada y se le añaden
 * fase y score. Si esa fila no existe (sessionStorage bloqueado, o la
 * llamada de sesión falló), se crea aquí — el flujo nunca se rompe.
 */
export async function POST(request: Request) {
  const ip = ipDePeticion(request);
  if (!permitirPeticion(ip)) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Bot detectado: respuesta falsa de éxito para no delatar el honeypot.
  if (body.website) {
    return NextResponse.json({ id: "ok", fase: "A1", score: 8, demo: false });
  }

  let resultado;
  try {
    resultado = calcularResultado(body.ruta, body.respuestas, body.textos ?? {});
  } catch (err) {
    if (err instanceof RespuestasInvalidasError) {
      return NextResponse.json({ error: "Respuestas incompletas" }, { status: 400 });
    }
    throw err;
  }

  const supabase = getSupabase();

  // Modo demo (sin Supabase): el flujo UI completo funciona sin persistir.
  if (!supabase) {
    return NextResponse.json({
      id: `demo-${resultado.fase}`,
      fase: resultado.fase,
      score: resultado.score,
      demo: true,
    });
  }

  const ahora = new Date().toISOString();
  const totalPreguntas = preguntasDeRuta(resultado.ruta).length;

  const camposResultado = {
    estado: "completado",
    fase: resultado.fase,
    score_numerico: resultado.score,
    respuestas: resultado.detalle,
    preguntas_respondidas: totalPreguntas,
    total_preguntas: totalPreguntas,
    ultima_pregunta_id: resultado.detalle.at(-1)?.preguntaId ?? null,
    problema_principal: resultado.tag,
    problema_otro: resultado.problemaOtro,
    nivel_intencion: resultado.nivelIntencion,
    texto_abierto: resultado.textoAbierto,
    // Servicio que el equipo comercial debería ofrecer (bloque 8.2).
    oferta_recomendada: ofertaRecomendada(resultado.fase, resultado.tag).id,
    version_cuestionario: VERSION_CUESTIONARIO,
    completado_at: ahora,
    ultima_actividad_at: ahora,
  };

  let fila: {
    id: string;
    fbp: string | null;
    fbc: string | null;
    client_ip: string | null;
    user_agent: string | null;
  } | null = null;

  if (body.sesionId) {
    const { data, error } = await supabase
      .from("diagnosticos")
      .update(camposResultado)
      // Una fila ya capturada no se toca: la persona solo está volviendo
      // atrás en el navegador, su resultado no debe reescribirse.
      .in("estado", ["iniciado", "completado"])
      .eq("id", body.sesionId)
      .select(COLUMNAS_CAPI)
      .maybeSingle();

    if (error) {
      console.error("[api/diagnostico] Error completando sesión:", error);
    }
    fila = data;
  }

  // Sin sesión previa (o ya capturada): se crea la fila completa aquí.
  if (!fila) {
    const { data, error } = await supabase
      .from("diagnosticos")
      .insert({
        token_resultado: generarToken(),
        ruta: resultado.ruta,
        iniciado_at: ahora,
        evento_id: body.idBase,
        utm_source: body.utm?.source ?? null,
        utm_medium: body.utm?.medium ?? null,
        utm_campaign: body.utm?.campaign ?? null,
        utm_content: body.utm?.content ?? null,
        utm_term: body.utm?.term ?? null,
        referrer: body.referrer ?? null,
        fbp: body.meta?.fbp ?? null,
        fbc: body.meta?.fbc ?? null,
        client_ip: ip === "desconocida" ? null : ip,
        user_agent: request.headers.get("user-agent"),
        ...camposResultado,
      })
      .select(COLUMNAS_CAPI)
      .single();

    if (error || !data) {
      console.error("[api/diagnostico] Error insertando:", error);
      return NextResponse.json({ error: "Error guardando" }, { status: 500 });
    }
    fila = data;
  }

  await enviarEventoCapi({
    evento: "DiagnosticoCompletado",
    idBase: body.idBase,
    persona: {
      fbp: fila.fbp ?? body.meta?.fbp,
      fbc: fila.fbc ?? body.meta?.fbc,
      ip: fila.client_ip ?? (ip === "desconocida" ? null : ip),
      userAgent: fila.user_agent ?? request.headers.get("user-agent"),
    },
    propiedades: {
      ruta: resultado.ruta,
      fase: resultado.fase,
      score: resultado.score,
      problema_principal: resultado.tag,
      nivel_intencion: resultado.nivelIntencion,
      utm_source: body.utm?.source,
      utm_campaign: body.utm?.campaign,
      utm_content: body.utm?.content,
    },
    urlOrigen: request.headers.get("referer"),
  });

  return NextResponse.json({
    id: fila.id,
    fase: resultado.fase,
    score: resultado.score,
    demo: false,
  });
}
