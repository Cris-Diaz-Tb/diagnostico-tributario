import "server-only";
import { redirectPermitido } from "./oauth";

/** Parámetros de /oauth/autorizar que viajan de la página al botón de aprobar. */
export const CAMPOS_AUTORIZACION = [
  "response_type",
  "client_id",
  "redirect_uri",
  "code_challenge",
  "code_challenge_method",
  "state",
  "scope",
  "resource",
] as const;

export type PedidoAutorizacion = Partial<Record<(typeof CAMPOS_AUTORIZACION)[number], string>>;

/** null si el pedido es válido; si no, el motivo (se muestra, nunca se redirige). */
export function problemaDelPedido(p: PedidoAutorizacion): string | null {
  if (p.response_type !== "code") return "response_type debe ser code.";
  if (!p.client_id || p.client_id.length > 100) return "Falta client_id.";
  if (!p.redirect_uri || !redirectPermitido(p.redirect_uri)) return "URL de retorno no permitida.";
  if (!p.code_challenge || !/^[A-Za-z0-9\-_]{43}$/.test(p.code_challenge)) return "Falta el code_challenge (PKCE).";
  if (p.code_challenge_method !== "S256") return "code_challenge_method debe ser S256.";
  if ((p.state?.length ?? 0) > 500) return "state demasiado largo.";
  return null;
}

export function urlDeRetorno(redirectUri: string, params: Record<string, string | undefined>): string {
  const url = new URL(redirectUri);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  return url.toString();
}
