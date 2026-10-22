import { NextResponse } from "next/server";
import { CORS, origenPublico } from "@/lib/mcp/oauth";

/** /.well-known/oauth-authorization-server (RFC 8414), vía rewrite. */
export async function GET(request: Request) {
  const base = origenPublico(request);
  return NextResponse.json(
    {
      issuer: base,
      authorization_endpoint: `${base}/oauth/autorizar`,
      token_endpoint: `${base}/api/oauth/token`,
      registration_endpoint: `${base}/api/oauth/registro`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: ["diagnosticos:leer"],
    },
    { headers: CORS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
