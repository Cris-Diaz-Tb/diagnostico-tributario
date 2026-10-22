import { NextResponse } from "next/server";
import { CORS, leerToken, llaveMcp, urlMetadatosRecurso } from "@/lib/mcp/oauth";
import { manejarMensaje } from "@/lib/mcp/servidor";
import { ipDePeticion, permitirPeticion } from "@/lib/ratelimit";

/**
 * Servidor MCP de los diagnósticos (solo lectura), para conectarlo como
 * conector en claude.ai. Requiere un token emitido por el OAuth de
 * /oauth/autorizar. Ver docs/mcp-diagnosticos.md.
 */

export const maxDuration = 60;

function noAutorizado(request: Request) {
  return NextResponse.json(
    { error: "No autorizado" },
    {
      status: 401,
      headers: {
        ...CORS,
        "WWW-Authenticate": `Bearer resource_metadata="${urlMetadatosRecurso(request)}"`,
      },
    }
  );
}

export async function POST(request: Request) {
  if (!llaveMcp()) {
    return NextResponse.json({ error: "MCP no configurado (falta MCP_LLAVE)" }, { status: 503, headers: CORS });
  }
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || !leerToken(token, "acceso")) return noAutorizado(request);

  if (!permitirPeticion(ipDePeticion(request), { limite: 120, ambito: "mcp" })) {
    return NextResponse.json({ error: "Demasiadas peticiones" }, { status: 429, headers: CORS });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido" } },
      { status: 400, headers: CORS }
    );
  }

  const mensajes = Array.isArray(cuerpo) ? cuerpo : [cuerpo];
  const respuestas = (await Promise.all(mensajes.slice(0, 20).map(manejarMensaje))).filter(Boolean);

  // Solo notificaciones: 202 sin cuerpo.
  if (respuestas.length === 0) return new NextResponse(null, { status: 202, headers: CORS });
  return NextResponse.json(Array.isArray(cuerpo) ? respuestas : respuestas[0], {
    headers: { ...CORS, "Cache-Control": "no-store" },
  });
}

// Sin sesiones ni streaming del servidor hacia el cliente.
export async function GET() {
  return new NextResponse(null, { status: 405, headers: { ...CORS, Allow: "POST" } });
}

export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { ...CORS, Allow: "POST" } });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
