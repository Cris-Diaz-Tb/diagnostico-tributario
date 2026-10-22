import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * OAuth mínimo para que claude.ai se conecte al MCP de los diagnósticos.
 *
 * claude.ai exige OAuth 2.1 con PKCE y registro dinámico de clientes. Aquí
 * no hay tablas: los códigos y tokens son mensajes firmados con HMAC
 * (derivado de MCP_LLAVE) que llevan su tipo y su vencimiento.
 *
 * La "cuenta" de Claude es MCP_LLAVE: una llave propia, distinta a la del
 * panel. Se escribe una vez en la pantalla de autorización. Cambiarla en
 * Vercel invalida todos los tokens emitidos (revocación total).
 *
 * Solo se aceptan URLs de retorno de claude.ai / claude.com, localhost (para
 * probar con el MCP Inspector) y las de MCP_REDIRECTS_EXTRA.
 */

export const DURACION_CODIGO_S = 5 * 60;
export const DURACION_ACCESO_S = 24 * 60 * 60;
export const DURACION_REFRESCO_S = 90 * 24 * 60 * 60;

export type TipoToken = "codigo" | "acceso" | "refresco";

export interface DatosToken {
  t: TipoToken;
  /** Vencimiento, en segundos Unix. */
  exp: number;
  /** client_id que lo pidió. */
  ci: string;
  /** Solo en el código: redirect_uri y code_challenge (PKCE S256). */
  ru?: string;
  cc?: string;
}

export function llaveMcp(): string | null {
  return process.env.MCP_LLAVE?.trim() || null;
}

function claveDeFirma(llave: string): Buffer {
  return createHmac("sha256", llave).update("dd-mcp-tokens-v1").digest();
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function emitirToken(datos: DatosToken, llave = llaveMcp()): string {
  if (!llave) throw new Error("MCP_LLAVE no configurada");
  const cuerpo = b64(JSON.stringify(datos));
  const firma = b64(createHmac("sha256", claveDeFirma(llave)).update(cuerpo).digest());
  return `dd1.${cuerpo}.${firma}`;
}

/** Verifica firma, tipo y vencimiento. null si algo no cuadra. */
export function leerToken(
  token: string,
  tipo: TipoToken,
  llave = llaveMcp(),
  ahora = Date.now()
): DatosToken | null {
  if (!llave || token.length > 4000) return null;
  const partes = token.split(".");
  if (partes.length !== 3 || partes[0] !== "dd1") return null;
  const [, cuerpo, firma] = partes;

  const esperada = createHmac("sha256", claveDeFirma(llave)).update(cuerpo).digest();
  const recibida = Buffer.from(firma, "base64url");
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;

  let datos: DatosToken;
  try {
    datos = JSON.parse(Buffer.from(cuerpo, "base64url").toString("utf8")) as DatosToken;
  } catch {
    return null;
  }
  if (datos.t !== tipo || typeof datos.exp !== "number" || datos.exp * 1000 < ahora) return null;
  return datos;
}

export function enSegundos(desdeAhora: number, ahora = Date.now()): number {
  return Math.floor(ahora / 1000) + desdeAhora;
}

/** PKCE S256: base64url(sha256(verifier)) === challenge. */
export function pkceValido(verifier: string, challenge: string): boolean {
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier)) return false;
  const calculado = Buffer.from(createHash("sha256").update(verifier).digest("base64url"));
  const esperado = Buffer.from(challenge);
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

export function llaveCorrecta(intento: string, llave = llaveMcp()): boolean {
  if (!llave) return false;
  // Se comparan hashes para que el largo de la llave no se filtre.
  const a = createHash("sha256").update(intento).digest();
  const b = createHash("sha256").update(llave).digest();
  return timingSafeEqual(a, b);
}

const HOSTS_CLAUDE = new Set(["claude.ai", "claude.com"]);

export function redirectPermitido(uri: string): boolean {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (url.hash) return false;
  if (url.protocol === "https:" && HOSTS_CLAUDE.has(url.hostname)) {
    return url.pathname === "/api/mcp/auth_callback";
  }
  if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
    return true;
  }
  const extra = (process.env.MCP_REDIRECTS_EXTRA ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return extra.includes(uri);
}

export function nuevoClientId(): string {
  return `dd-${randomBytes(12).toString("base64url")}`;
}

/** Origen público del sitio, tal como lo ve quien llama. */
export function origenPublico(request: Request): string {
  return new URL(request.url).origin;
}

export function urlMetadatosRecurso(request: Request): string {
  return `${origenPublico(request)}/.well-known/oauth-protected-resource`;
}

/** Headers CORS: el MCP Inspector llama desde el navegador. Sin cookies. */
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
} as const;
