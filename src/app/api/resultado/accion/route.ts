import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { esAccionResultado } from "@/lib/accion-resultado";
import { ipDePeticion, permitirPeticion } from "@/lib/ratelimit";

/**
 * Registra el último botón que tocó el lead en la página de resultado.
 *
 * Se identifica por el token del resultado (el mismo que va en la URL),
 * no por el id: quien no tiene el enlace no puede marcar acciones ajenas.
 * El navegador lo manda con sendBeacon, así que la respuesta no se lee;
 * nunca debe frenar la navegación del botón.
 */
export async function POST(request: Request) {
  if (!permitirPeticion(ipDePeticion(request), { limite: 30, ambito: "accion" })) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429 });
  }

  let cuerpo: { token?: unknown; accion?: unknown };
  try {
    cuerpo = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { token, accion } = cuerpo;
  if (typeof token !== "string" || !token || token.length > 100 || !esAccionResultado(accion)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase || token.startsWith("demo-")) {
    return NextResponse.json({ registrado: false });
  }

  const { error } = await supabase
    .from("diagnosticos")
    .update({ accion_resultado: accion, accion_resultado_at: new Date().toISOString() })
    .eq("token_resultado", token);

  if (error) {
    console.error("[resultado/accion] Error guardando la acción:", error);
    return NextResponse.json({ error: "Error de base de datos" }, { status: 500 });
  }
  return NextResponse.json({ registrado: true });
}
