import { NextResponse } from "next/server";
import { DURACION_CODIGO_S, emitirToken, enSegundos, llaveCorrecta, origenPublico } from "@/lib/mcp/oauth";
import { CAMPOS_AUTORIZACION, problemaDelPedido, urlDeRetorno, type PedidoAutorizacion } from "@/lib/mcp/autorizacion";
import { ipDePeticion, permitirPeticion } from "@/lib/ratelimit";

/**
 * Recibe el formulario de /oauth/autorizar. Con la llave correcta emite el
 * código de autorización y devuelve a claude.ai.
 *
 * La vuelta a claude.ai es una página con meta refresh, no un redirect: la
 * CSP del sitio (form-action 'self') bloquea redirigir el envío de un
 * formulario a otro dominio.
 */

function volverAlFormulario(request: Request, pedido: PedidoAutorizacion, error: string) {
  const url = new URL("/oauth/autorizar", origenPublico(request));
  for (const [k, v] of Object.entries(pedido)) if (v) url.searchParams.set(k, v);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

function escaparHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function paginaDeRetorno(destino: string) {
  const href = escaparHtml(destino);
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${href}"><title>Volviendo a Claude…</title><style>body{background:#0A0F16;color:#e5e7eb;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:16px}a{color:#7dd3fc}</style></head><body><p>Volviendo a Claude… <a href="${href}">Continuar</a></p></body></html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const pedido: PedidoAutorizacion = Object.fromEntries(
    CAMPOS_AUTORIZACION.map((c) => [c, typeof form.get(c) === "string" ? String(form.get(c)) : undefined])
  );

  const problema = problemaDelPedido(pedido);
  if (problema) return NextResponse.json({ error: "invalid_request", error_description: problema }, { status: 400 });
  const redirectUri = pedido.redirect_uri!;

  if (form.get("decision") === "rechazar") {
    return paginaDeRetorno(urlDeRetorno(redirectUri, { error: "access_denied", state: pedido.state }));
  }

  if (!permitirPeticion(ipDePeticion(request), { limite: 5, ambito: "mcp-login" })) {
    return volverAlFormulario(request, pedido, "limite");
  }
  if (!llaveCorrecta(String(form.get("llave") ?? ""))) {
    return volverAlFormulario(request, pedido, "llave");
  }

  const code = emitirToken({
    t: "codigo",
    ci: pedido.client_id!,
    ru: redirectUri,
    cc: pedido.code_challenge!,
    exp: enSegundos(DURACION_CODIGO_S),
  });
  return paginaDeRetorno(
    urlDeRetorno(redirectUri, { code, state: pedido.state, iss: origenPublico(request) })
  );
}
