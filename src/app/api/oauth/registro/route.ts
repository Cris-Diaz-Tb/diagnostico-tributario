import { NextResponse } from "next/server";
import { CORS, llaveMcp, nuevoClientId, redirectPermitido } from "@/lib/mcp/oauth";
import { ipDePeticion, permitirPeticion } from "@/lib/ratelimit";

/**
 * Registro dinámico de clientes (RFC 7591). No se guarda nada: lo que
 * protege es que solo se aceptan URLs de retorno conocidas (claude.ai,
 * localhost) y que autorizar exige la llave de Claude.
 */
export async function POST(request: Request) {
  if (!llaveMcp()) {
    return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503, headers: CORS });
  }
  if (!permitirPeticion(ipDePeticion(request), { limite: 20, ambito: "oauth-registro" })) {
    return NextResponse.json({ error: "slow_down" }, { status: 429, headers: CORS });
  }

  let cuerpo: { redirect_uris?: unknown; client_name?: unknown };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400, headers: CORS });
  }

  const uris = Array.isArray(cuerpo.redirect_uris) ? cuerpo.redirect_uris : [];
  if (uris.length === 0 || uris.length > 5 || !uris.every((u) => typeof u === "string" && redirectPermitido(u))) {
    return NextResponse.json(
      { error: "invalid_redirect_uri", error_description: "URL de retorno no permitida" },
      { status: 400, headers: CORS }
    );
  }

  return NextResponse.json(
    {
      client_id: nuevoClientId(),
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: typeof cuerpo.client_name === "string" ? cuerpo.client_name.slice(0, 100) : undefined,
      redirect_uris: uris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    { status: 201, headers: CORS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
