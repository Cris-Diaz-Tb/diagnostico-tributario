import "server-only";
import { createHash } from "node:crypto";
import { idDeEvento, type EventoMeta } from "./meta-eventos";
import { valorConfig } from "./configuracion";

/**
 * API de Conversiones de Meta (server-side).
 *
 * Por qué existe además del pixel: entre bloqueadores, iOS y extensiones,
 * una parte grande de los eventos de navegador nunca llega. El envío desde
 * servidor no se puede bloquear, y al mandar el MISMO event_id que el pixel,
 * Meta une ambos y no cuenta doble.
 *
 * Las credenciales salen de /admin/configuracion, con las variables de
 * entorno (META_PIXEL_ID, META_CAPI_TOKEN) como respaldo. Sin ellas todo
 * es no-op, igual que el wrapper de PostHog: la plataforma funciona sin esto.
 */

const VERSION_API_POR_DEFECTO = "v26.0";

/** Los datos de contacto viajan hasheados; Meta nunca recibe el dato en claro. */
function hash(valor: string | null | undefined): string | undefined {
  if (!valor) return undefined;
  const normalizado = valor.trim().toLowerCase();
  if (!normalizado) return undefined;
  return createHash("sha256").update(normalizado).digest("hex");
}

/** Teléfono: Meta exige solo dígitos (sin +, espacios ni guiones). */
function hashTelefono(valor: string | null | undefined): string | undefined {
  if (!valor) return undefined;
  const soloDigitos = valor.replace(/\D/g, "");
  return soloDigitos ? hash(soloDigitos) : undefined;
}

export interface PersonaMeta {
  email?: string | null;
  telefono?: string | null;
  nombre?: string | null;
  /** Cookies del pixel — no se hashean. */
  fbp?: string | null;
  fbc?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface EnvioCapi {
  evento: EventoMeta;
  /** Id base de la sesión; el event_id final se deriva de él. */
  idBase: string;
  persona: PersonaMeta;
  /** Cuándo ocurrió de verdad. Meta acepta hasta 7 días de antigüedad. */
  momento?: Date;
  propiedades?: Record<string, string | number | null | undefined>;
  urlOrigen?: string | null;
}

function construirUserData(persona: PersonaMeta): Record<string, unknown> {
  const [nombrePila, ...resto] = (persona.nombre ?? "").trim().split(/\s+/);

  const datos: Record<string, unknown> = {
    em: hash(persona.email),
    ph: hashTelefono(persona.telefono),
    fn: hash(nombrePila),
    ln: hash(resto.join(" ")),
    fbp: persona.fbp ?? undefined,
    fbc: persona.fbc ?? undefined,
    client_ip_address: persona.ip ?? undefined,
    client_user_agent: persona.userAgent ?? undefined,
  };

  // Meta rechaza el evento si vienen claves con valor nulo.
  for (const clave of Object.keys(datos)) {
    if (datos[clave] === undefined) delete datos[clave];
  }
  return datos;
}

/**
 * Devuelve true si el evento se entregó. Nunca lanza: la medición jamás
 * debe tumbar el flujo de la persona que está haciendo el diagnóstico.
 */
export async function enviarEventoCapi({
  evento,
  idBase,
  persona,
  momento,
  propiedades,
  urlOrigen,
}: EnvioCapi): Promise<boolean> {
  const [pixelId, token, versionApi, testEventCode] = await Promise.all([
    valorConfig("meta_pixel_id"),
    valorConfig("meta_capi_token"),
    valorConfig("meta_api_version"),
    valorConfig("meta_test_event_code"),
  ]);
  if (!pixelId || !token) return false;

  const customData: Record<string, unknown> = {};
  for (const [clave, valor] of Object.entries(propiedades ?? {})) {
    if (valor !== null && valor !== undefined) customData[clave] = valor;
  }

  const cuerpo: Record<string, unknown> = {
    data: [
      {
        event_name: evento,
        event_time: Math.floor((momento ?? new Date()).getTime() / 1000),
        event_id: idDeEvento(idBase, evento),
        action_source: "website",
        event_source_url: urlOrigen ?? undefined,
        user_data: construirUserData(persona),
        custom_data: customData,
      },
    ],
  };

  // Con test_event_code los eventos aparecen en el probador del Events
  // Manager sin ensuciar los datos reales. Solo se manda si está definido.
  if (testEventCode) {
    cuerpo.test_event_code = testEventCode;
  }

  try {
    const respuesta = await fetch(
      `https://graph.facebook.com/${versionApi || VERSION_API_POR_DEFECTO}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      }
    );

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      console.error(`[meta-capi] ${evento} rechazado (${respuesta.status}):`, detalle);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[meta-capi] ${evento} falló:`, err);
    return false;
  }
}

/** Solo para tests: expone la normalización sin salir a la red. */
export const _internos = { hash, hashTelefono, construirUserData };

/**
 * Comprueba que el pixel y el token sirven, usando el MISMO endpoint que
 * el envío real de eventos.
 *
 * Por qué no se consulta `GET /{pixel}` para leer su nombre: los tokens
 * que genera Events Manager para la API de Conversiones pueden enviar
 * eventos pero no suelen poder leer los metadatos del dataset, así que
 * esa vía daba "Missing Permission" con credenciales perfectamente
 * válidas.
 *
 * Sin código de prueba configurado se manda `data: []`: Meta valida token
 * y permisos primero, y solo entonces responde que el array va vacío. Ese
 * error concreto es, justamente, la prueba de que las credenciales sirven,
 * y no ensucia los datos reales con un evento inventado.
 *
 * Con código de prueba configurado sí se envía un evento real, que aparece
 * en Events Manager → Probar eventos, sin contaminar las conversiones.
 */
function esErrorDeArrayVacio(mensaje: string): boolean {
  return /param data/i.test(mensaje) && /non-empty|empty|required/i.test(mensaje);
}

export async function probarCredencialesMeta(): Promise<{
  ok: boolean;
  detalle: string;
}> {
  const [pixelId, token, versionApi, testEventCode] = await Promise.all([
    valorConfig("meta_pixel_id"),
    valorConfig("meta_capi_token"),
    valorConfig("meta_api_version"),
    valorConfig("meta_test_event_code"),
  ]);

  if (!pixelId) return { ok: false, detalle: "Falta el ID del pixel." };
  if (!token) return { ok: false, detalle: "Falta el token de la API de Conversiones." };

  const version = versionApi || VERSION_API_POR_DEFECTO;

  const cuerpo: Record<string, unknown> = { data: [] };
  if (testEventCode) {
    cuerpo.test_event_code = testEventCode;
    cuerpo.data = [
      {
        event_name: "PageView",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `prueba-panel-${Date.now()}`,
        action_source: "website",
        user_data: {},
      },
    ];
  }

  try {
    const respuesta = await fetch(
      `https://graph.facebook.com/${version}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      }
    );
    const datos = (await respuesta.json()) as {
      events_received?: number;
      error?: { message?: string };
    };

    if (respuesta.ok) {
      return {
        ok: true,
        detalle: testEventCode
          ? "Evento de prueba enviado. Revísalo en Events Manager → Probar eventos."
          : "El token puede enviar eventos a este pixel.",
      };
    }

    const mensaje = datos.error?.message ?? `Meta respondió ${respuesta.status}.`;
    if (esErrorDeArrayVacio(mensaje)) {
      return {
        ok: true,
        detalle:
          "El token puede enviar eventos a este pixel. No se envió ningún evento de prueba, para no alterar tus datos.",
      };
    }
    return { ok: false, detalle: mensaje };
  } catch (err) {
    return { ok: false, detalle: `No se pudo contactar a Meta: ${String(err)}` };
  }
}

/** Solo para tests: la heurística que distingue el error inofensivo. */
export const _pruebaInternos = { esErrorDeArrayVacio };
