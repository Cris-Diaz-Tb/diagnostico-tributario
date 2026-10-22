import { NextResponse } from "next/server";
import {
  CORS,
  DURACION_ACCESO_S,
  DURACION_REFRESCO_S,
  emitirToken,
  enSegundos,
  leerToken,
  llaveMcp,
  pkceValido,
} from "@/lib/mcp/oauth";
import { ipDePeticion, permitirPeticion } from "@/lib/ratelimit";

/** Endpoint de token: canjea el código (con PKCE) o renueva con el refresh token. */

function falla(error: string, descripcion: string, status = 400) {
  return NextResponse.json(
    { error, error_description: descripcion },
    { status, headers: { ...CORS, "Cache-Control": "no-store" } }
  );
}

async function leerCuerpo(request: Request): Promise<Record<string, string>> {
  const tipo = request.headers.get("content-type") ?? "";
  if (tipo.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(json).map(([k, v]) => [k, String(v ?? "")]));
  }
  return Object.fromEntries(new URLSearchParams(await request.text()));
}

function tokens(clientId: string) {
  return NextResponse.json(
    {
      access_token: emitirToken({ t: "acceso", ci: clientId, exp: enSegundos(DURACION_ACCESO_S) }),
      token_type: "Bearer",
      expires_in: DURACION_ACCESO_S,
      refresh_token: emitirToken({ t: "refresco", ci: clientId, exp: enSegundos(DURACION_REFRESCO_S) }),
      scope: "diagnosticos:leer",
    },
    { headers: { ...CORS, "Cache-Control": "no-store", Pragma: "no-cache" } }
  );
}

export async function POST(request: Request) {
  if (!llaveMcp()) return falla("temporarily_unavailable", "MCP no configurado", 503);
  if (!permitirPeticion(ipDePeticion(request), { limite: 30, ambito: "oauth-token" })) {
    return falla("slow_down", "Demasiadas peticiones", 429);
  }

  let p: Record<string, string>;
  try {
    p = await leerCuerpo(request);
  } catch {
    return falla("invalid_request", "Cuerpo inválido");
  }

  if (p.grant_type === "authorization_code") {
    const codigo = leerToken(p.code ?? "", "codigo");
    if (!codigo) return falla("invalid_grant", "Código inválido o vencido");
    if (codigo.ru !== p.redirect_uri) return falla("invalid_grant", "redirect_uri no coincide");
    if (p.client_id && p.client_id !== codigo.ci) return falla("invalid_grant", "client_id no coincide");
    if (!codigo.cc || !pkceValido(p.code_verifier ?? "", codigo.cc)) {
      return falla("invalid_grant", "PKCE inválido");
    }
    return tokens(codigo.ci);
  }

  if (p.grant_type === "refresh_token") {
    const refresco = leerToken(p.refresh_token ?? "", "refresco");
    if (!refresco) return falla("invalid_grant", "Refresh token inválido o vencido");
    return tokens(refresco.ci);
  }

  return falla("unsupported_grant_type", "Solo authorization_code y refresh_token");
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
