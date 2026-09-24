import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { enviarRoadmapPorEmail } from "@/lib/email";
import { sincronizarLeadConCrm } from "@/lib/crm";
import { ofertaRecomendada } from "@/content/ofertas";
import { FASES } from "@/content/roadmaps";
import { enviarEventoCapi } from "@/lib/meta-capi";
import { generarToken } from "@/lib/token";
import { ipDePeticion, permitirPeticion } from "@/lib/ratelimit";
import { telefonoValido } from "@/lib/telefono";
import type { FaseId, Ruta } from "@/content/tipos";

const bodySchema = z.object({
  id: z.string().min(1).max(100),
  nombre: z.string().min(1).max(120),
  email: z.email(),
  // Obligatorio: por WhatsApp se confirma la asesoría agendada.
  telefono: z.string().max(30).refine(telefonoValido),
  consentimiento: z.literal(true),
  /** Id base de la sesión, para deduplicar el Lead con el pixel. */
  idBase: z.string().min(8).max(100),
  website: z.string().optional(), // honeypot
});

/**
 * Captura el email tras mostrar el resultado parcial. Actualiza el registro
 * (email, consentimiento, timestamps), envía el roadmap por email y devuelve
 * el token del resultado — el link a /resultado/[token] solo existe después
 * de este paso (el gate del lead magnet).
 */
export async function POST(request: Request) {
  if (!permitirPeticion(ipDePeticion(request))) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Bot detectado: éxito falso.
  if (body.website) {
    return NextResponse.json({ token: `demo-A1-${generarToken()}` });
  }

  const supabase = getSupabase();

  // Modo demo: el id codifica la fase (demo-A2). El token también, para
  // que /resultado/[token] pueda renderizar sin base de datos.
  // SOLO se acepta cuando Supabase NO está configurado (desarrollo local):
  // en producción, un id demo permitiría disparar emails de marca hacia
  // cualquier dirección sin haber completado un diagnóstico real (relé
  // de correo abierto).
  if (body.id.startsWith("demo-")) {
    if (supabase) {
      return NextResponse.json({ error: "Diagnóstico no encontrado" }, { status: 404 });
    }
    const fase = body.id.slice(5) as FaseId;
    if (!FASES.includes(fase)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const token = `demo-${fase}-${generarToken()}`;
    await enviarRoadmapPorEmail({
      para: body.email,
      nombre: body.nombre,
      fase,
      token,
    });
    return NextResponse.json({ token });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 });
  }

  const ahora = new Date().toISOString();
  const { data, error } = await supabase
    .from("diagnosticos")
    .update({
      nombre: body.nombre,
      email: body.email,
      telefono: body.telefono,
      consentimiento: true,
      consentimiento_at: ahora,
      email_capturado_at: ahora,
      // Cierra el embudo: deja de contar como abandono.
      estado: "capturado",
      ultima_actividad_at: ahora,
    })
    .eq("id", body.id)
    .select(
      "token_resultado, ruta, fase, score_numerico, problema_principal, nivel_intencion, fbp, fbc, client_ip, user_agent, utm_source, utm_campaign, utm_content"
    )
    .single();

  if (error || !data) {
    console.error("[api/capturar] Error actualizando:", error);
    return NextResponse.json({ error: "Diagnóstico no encontrado" }, { status: 404 });
  }

  const fase = data.fase as FaseId;
  const problema = data.problema_principal as string | null;
  const urlResultado = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/resultado/${data.token_resultado}`;

  // Email, CRM y Meta son secundarios al flujo: si fallan, la persona igual
  // ve su resultado en pantalla y el lead ya está en Supabase (queda log).
  await Promise.all([
    // `Lead` es el evento estándar a optimizar en las campañas de Meta.
    // Va con los datos de contacto hasheados, que es lo que sube la
    // calidad de coincidencia y permite atribuirlo al anuncio exacto.
    enviarEventoCapi({
      evento: "Lead",
      idBase: body.idBase,
      persona: {
        email: body.email,
        telefono: body.telefono,
        nombre: body.nombre,
        fbp: data.fbp as string | null,
        fbc: data.fbc as string | null,
        ip: (data.client_ip as string | null) ?? ipDePeticion(request),
        userAgent:
          (data.user_agent as string | null) ?? request.headers.get("user-agent"),
      },
      propiedades: {
        ruta: data.ruta as string,
        fase: data.fase as string,
        score: data.score_numerico as number,
        problema_principal: data.problema_principal as string | null,
        utm_source: data.utm_source as string | null,
        utm_campaign: data.utm_campaign as string | null,
        utm_content: data.utm_content as string | null,
      },
      urlOrigen: request.headers.get("referer"),
    }),
    enviarRoadmapPorEmail({
      para: body.email,
      nombre: body.nombre,
      fase: data.fase as FaseId,
      token: data.token_resultado,
      tag: data.problema_principal as string | null,
      // Viaja al enlace de agendamiento para poder cruzar la llamada
      // con las respuestas de esta persona.
      identificador: body.id,
    }),
    sincronizarLeadConCrm({
      email: body.email,
      nombre: body.nombre,
      telefono: body.telefono,
      ruta: data.ruta as Ruta,
      fase,
      score: data.score_numerico as number,
      problema,
      nivelIntencion: data.nivel_intencion as string | null,
      oferta: ofertaRecomendada(fase, problema).id,
      urlResultado,
    }),
  ]);

  return NextResponse.json({ token: data.token_resultado });
}
