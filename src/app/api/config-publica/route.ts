import { NextResponse } from "next/server";
import { valorConfig } from "@/lib/configuracion";

/**
 * Configuración que el navegador necesita conocer.
 *
 * Solo devuelve el id del pixel de Meta, que es público por definición
 * (viaja incrustado en cualquier web que lo use). El token de la API de
 * Conversiones NUNCA sale de aquí: se usa únicamente en servidor.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const metaPixelId = (await valorConfig("meta_pixel_id")) ?? null;

  return NextResponse.json(
    { metaPixelId },
    {
      headers: {
        // Un minuto de caché: cambiar el pixel en el panel se refleja
        // rápido sin pegarle a la base en cada visita.
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
