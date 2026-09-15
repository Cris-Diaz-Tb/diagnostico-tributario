import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { enviarEventoCapi } from "@/lib/meta-capi";

/**
 * Barrido de diagnósticos abandonados.
 *
 * El evento de abandono no se puede disparar desde el navegador: para
 * cuando sabemos que la persona abandonó, ya cerró la pestaña. Por eso se
 * envía en diferido desde servidor, reusando la IP y el user-agent que se
 * guardaron al iniciar la sesión.
 *
 * Lo agenda Vercel Cron (ver vercel.json). El panel NO depende de esto:
 * la tasa de abandono se calcula al leer, en la vista `diagnosticos_embudo`.
 * Este job existe solo para alimentar a Meta y para purgar datos viejos.
 */

/** Meta rechaza eventos de más de 7 días. */
const MAX_DIAS_META = 7;
/** Retención de diagnósticos abandonados (declarada en /privacidad). */
const DIAS_RETENCION = 180;
/** Tope por ejecución, para no agotar el tiempo de la función. */
const LOTE = 200;

const MINUTOS_INACTIVIDAD = 30;

export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 });
  }

  const ahora = Date.now();
  const corteInactividad = new Date(ahora - MINUTOS_INACTIVIDAD * 60_000).toISOString();

  const { data: abandonados, error } = await supabase
    .from("diagnosticos")
    .select(
      "id, ruta, fase, score_numerico, problema_principal, preguntas_respondidas, total_preguntas, estado, ultima_actividad_at, fbp, fbc, client_ip, user_agent, evento_id, utm_source, utm_campaign, utm_content"
    )
    .neq("estado", "capturado")
    .is("capi_abandono_at", null)
    .not("evento_id", "is", null)
    .lt("ultima_actividad_at", corteInactividad)
    .order("ultima_actividad_at", { ascending: true })
    .limit(LOTE);

  if (error) {
    console.error("[cron/abandonos] Error consultando:", error);
    return NextResponse.json({ error: "Error consultando" }, { status: 500 });
  }

  let enviados = 0;
  let vencidos = 0;

  for (const fila of abandonados ?? []) {
    const momento = new Date(fila.ultima_actividad_at as string);
    const diasDeAntiguedad = (ahora - momento.getTime()) / 86_400_000;

    // Demasiado viejo para que Meta lo acepte: se marca igual para no
    // reintentarlo en cada ejecución.
    if (diasDeAntiguedad > MAX_DIAS_META) {
      vencidos += 1;
    } else {
      const ok = await enviarEventoCapi({
        evento: "DiagnosticoAbandonado",
        idBase: fila.evento_id as string,
        momento,
        persona: {
          fbp: fila.fbp as string | null,
          fbc: fila.fbc as string | null,
          ip: fila.client_ip as string | null,
          userAgent: fila.user_agent as string | null,
        },
        propiedades: {
          ruta: fila.ruta as string,
          // `abandono_gate` = completó las preguntas pero no dejó el email.
          // `abandono_preguntas` = se cayó a mitad del quiz.
          tipo_abandono:
            fila.estado === "completado" ? "abandono_gate" : "abandono_preguntas",
          fase: fila.fase as string | null,
          score: fila.score_numerico as number | null,
          problema_principal: fila.problema_principal as string | null,
          preguntas_respondidas: fila.preguntas_respondidas as number,
          total_preguntas: fila.total_preguntas as number | null,
          utm_source: fila.utm_source as string | null,
          utm_campaign: fila.utm_campaign as string | null,
          utm_content: fila.utm_content as string | null,
        },
      });
      // Si Meta falla, no se marca: se reintenta en el siguiente barrido.
      if (!ok) continue;
      enviados += 1;
    }

    await supabase
      .from("diagnosticos")
      .update({ capi_abandono_at: new Date().toISOString() })
      .eq("id", fila.id);
  }

  // Purga de retención: diagnósticos abandonados que nunca dejaron contacto.
  const corteRetencion = new Date(ahora - DIAS_RETENCION * 86_400_000).toISOString();
  const { error: errorPurga, count: purgados } = await supabase
    .from("diagnosticos")
    .delete({ count: "exact" })
    .neq("estado", "capturado")
    .is("email", null)
    .lt("iniciado_at", corteRetencion);

  if (errorPurga) console.error("[cron/abandonos] Error purgando:", errorPurga);

  return NextResponse.json({
    revisados: abandonados?.length ?? 0,
    enviados,
    vencidos,
    purgados: purgados ?? 0,
  });
}
