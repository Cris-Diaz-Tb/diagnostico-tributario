"use client";

import { COOKIE_PRUEBA } from "./prueba";

/**
 * Captura la atribución al aterrizar y la conserva entre páginas, pestañas
 * y recargas durante VIGENCIA_MS.
 *
 * Se envía en la PRIMERA respuesta del quiz, no al final — así un
 * diagnóstico abandonado también conserva de dónde vino, que es
 * justamente lo que permite saber qué campaña trae gente que no termina.
 *
 * Además de los UTMs se capturan los click-id de cada plataforma
 * (fbclid, gclid, ttclid): sin ellos la conversión no se puede atribuir
 * al anuncio exacto que la generó.
 *
 * Antes vivía en sessionStorage y solo se capturaba en la portada: si el
 * anuncio llevaba directo a /diagnostico, o la persona volvía en otra
 * pestaña, el lead quedaba como "directo". Ahora se captura en todas las
 * páginas y se guarda en localStorage.
 */

const CLAVE = "dd_utm";
/** Ventana de atribución: una visita sin UTMs dentro de este plazo hereda la última campaña. */
const VIGENCIA_MS = 7 * 86_400_000;

/** Parámetros que indican que la visita viene de una campaña. */
const PARAMS_CAMPANA = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "ttclid",
];

export interface DatosUtm {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  referrer: string | null;
  landingPath: string | null;
  fbclid: string | null;
  gclid: string | null;
  ttclid: string | null;
  /** Momento del clic en el anuncio — necesario para reconstruir _fbc. */
  fbclidAt: number | null;
  /** Cuándo empezó esta atribución, para hacer vencer la ventana. */
  capturadoAt?: number;
}

/**
 * Decide la atribución vigente. Una visita con parámetros de campaña
 * reemplaza el set COMPLETO (no campo a campo: mezclar el source de un
 * anuncio con el content de otro da una atribución que no existe). Sin
 * parámetros, se conserva la anterior mientras siga vigente.
 */
export function resolverAtribucion(
  params: URLSearchParams,
  previo: DatosUtm | null,
  contexto: { referrer: string | null; path: string; ahora: number }
): DatosUtm {
  const esCampana = PARAMS_CAMPANA.some((p) => params.get(p));
  const vigente =
    previo && contexto.ahora - (previo.capturadoAt ?? contexto.ahora) < VIGENCIA_MS
      ? previo
      : null;

  if (!esCampana && vigente) return vigente;

  const fbclid = params.get("fbclid");
  return {
    source: params.get("utm_source"),
    medium: params.get("utm_medium"),
    campaign: params.get("utm_campaign"),
    content: params.get("utm_content"),
    term: params.get("utm_term"),
    referrer: contexto.referrer,
    landingPath: contexto.path,
    fbclid,
    gclid: params.get("gclid"),
    ttclid: params.get("ttclid"),
    // El _fbc reconstruido debe apuntar al instante real del clic.
    fbclidAt: fbclid ? contexto.ahora : null,
    capturadoAt: contexto.ahora,
  };
}

export function capturarUtm(): void {
  try {
    const datos = resolverAtribucion(new URLSearchParams(window.location.search), leerUtm(), {
      referrer: document.referrer || null,
      path: window.location.pathname,
      ahora: Date.now(),
    });
    localStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    // localStorage no disponible (modo privado extremo): seguir sin UTMs
  }
}

export function leerUtm(): DatosUtm | null {
  try {
    // sessionStorage: donde vivía antes, para no perder sesiones abiertas.
    const crudo = localStorage.getItem(CLAVE) ?? sessionStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as DatosUtm) : null;
  } catch {
    return null;
  }
}

/**
 * Pruebas internas: `?prueba=1` en cualquier página marca este navegador
 * (y el login al panel hace lo mismo); `?prueba=0` lo desmarca. El
 * servidor lee la cookie al crear el diagnóstico.
 */
export function capturarMarcaPrueba(): void {
  try {
    const valor = new URLSearchParams(window.location.search).get("prueba");
    if (valor === "1") {
      document.cookie = `${COOKIE_PRUEBA}=1; path=/; max-age=31536000; samesite=lax`;
    } else if (valor === "0") {
      document.cookie = `${COOKIE_PRUEBA}=; path=/; max-age=0; samesite=lax`;
    }
  } catch {
    // Sin cookies: la prueba se puede marcar a mano desde el panel.
  }
}

function leerCookie(nombre: string): string | null {
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${nombre}=([^;]*)`)
    );
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export interface CookiesMeta {
  fbp: string | null;
  fbc: string | null;
}

/**
 * Formato de _fbc según Meta: `fb.<índice de subdominio>.<ms del clic>.<fbclid>`.
 * Se usa 1 porque el sitio vive en un subdominio propio (diagnostico.*).
 */
export function construirFbc(fbclid: string, momentoClic: number): string {
  return `fb.1.${momentoClic}.${fbclid}`;
}

/**
 * Cookies del pixel de Meta, necesarias para que la API de Conversiones
 * haga match con la persona que vio el anuncio.
 *
 * Si el pixel todavía no escribió _fbc (o está bloqueado) pero la URL
 * traía fbclid, se reconstruye con el formato de Meta:
 * `fb.<subdominio>.<timestamp del clic>.<fbclid>`.
 */
export function leerCookiesMeta(): CookiesMeta {
  const fbp = leerCookie("_fbp");
  const fbcReal = leerCookie("_fbc");
  if (fbcReal) return { fbp, fbc: fbcReal };

  const utm = leerUtm();
  if (!utm?.fbclid) return { fbp, fbc: null };

  return {
    fbp,
    fbc: construirFbc(utm.fbclid, utm.fbclidAt ?? Date.now()),
  };
}

/** Payload de atribución que viaja al servidor al crear la sesión. */
export function atribucionParaEnviar() {
  const utm = leerUtm();
  const { fbp, fbc } = leerCookiesMeta();
  return {
    utm: utm
      ? {
          source: utm.source,
          medium: utm.medium,
          campaign: utm.campaign,
          content: utm.content,
          term: utm.term,
        }
      : null,
    referrer: utm?.referrer ?? null,
    landingPath: utm?.landingPath ?? null,
    clickIds: {
      fbclid: utm?.fbclid ?? null,
      gclid: utm?.gclid ?? null,
      ttclid: utm?.ttclid ?? null,
    },
    meta: { fbp, fbc },
  };
}
