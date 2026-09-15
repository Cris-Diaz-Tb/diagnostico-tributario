import "server-only";
import { createHash } from "node:crypto";
import { idDeEvento, type EventoMeta } from "./meta-eventos";

/**
 * API de Conversiones de Meta (server-side).
 *
 * Por qué existe además del pixel: entre bloqueadores, iOS y extensiones,
 * una parte grande de los eventos de navegador nunca llega. El envío desde
 * servidor no se puede bloquear, y al mandar el MISMO event_id que el pixel,
 * Meta une ambos y no cuenta doble.
 *
 * Sin META_PIXEL_ID / META_CAPI_TOKEN todo es no-op — igual que el wrapper
 * de PostHog en lib/analytics.ts. La plataforma funciona sin esto.
 */

const VERSION_API = process.env.META_API_VERSION || "v26.0";

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
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
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
  if (process.env.META_TEST_EVENT_CODE) {
    cuerpo.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  try {
    const respuesta = await fetch(
      `https://graph.facebook.com/${VERSION_API}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
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
