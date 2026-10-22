import { NextResponse } from "next/server";
import { CORS, origenPublico } from "@/lib/mcp/oauth";

/** /.well-known/oauth-protected-resource (RFC 9728), vía rewrite. */
export async function GET(request: Request) {
  const base = origenPublico(request);
  return NextResponse.json(
    {
      resource: `${base}/api/mcp`,
      authorization_servers: [base],
      bearer_methods_supported: ["header"],
      resource_name: "Diagnóstico Cris. Tributario",
    },
    { headers: CORS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
