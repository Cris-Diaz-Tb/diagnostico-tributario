"use client";

/**
 * Captura la atribución al aterrizar y la conserva en sessionStorage
 * durante toda la sesión.
 *
 * Se envía en la PRIMERA respuesta del quiz, no al final — así un
 * diagnóstico abandonado también conserva de dónde vino, que es
 * justamente lo que permite saber qué campaña trae gente que no termina.
 *
 * Además de los UTMs se capturan los click-id de cada plataforma
 * (fbclid, gclid, ttclid): sin ellos la conversión no se puede atribuir
 * al anuncio exacto que la generó.
 */

const CLAVE = "dd_utm";

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
}

export function capturarUtm(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const previo = leerUtm();
    const fbclid = params.get("fbclid") ?? previo?.fbclid ?? null;

    const datos: DatosUtm = {
      source: params.get("utm_source") ?? previo?.source ?? null,
      medium: params.get("utm_medium") ?? previo?.medium ?? null,
      campaign: params.get("utm_campaign") ?? previo?.campaign ?? null,
      content: params.get("utm_content") ?? previo?.content ?? null,
      term: params.get("utm_term") ?? previo?.term ?? null,
      referrer: previo?.referrer ?? (document.referrer || null),
      landingPath: previo?.landingPath ?? window.location.pathname,
      fbclid,
      gclid: params.get("gclid") ?? previo?.gclid ?? null,
      ttclid: params.get("ttclid") ?? previo?.ttclid ?? null,
      // Se sella la primera vez que se ve el fbclid y no se vuelve a tocar:
      // el _fbc reconstruido debe apuntar al instante real del clic.
      fbclidAt: previo?.fbclidAt ?? (params.get("fbclid") ? Date.now() : null),
    };

    sessionStorage.setItem(CLAVE, JSON.stringify(datos));
  } catch {
    // sessionStorage no disponible (modo privado extremo): seguir sin UTMs
  }
}

export function leerUtm(): DatosUtm | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as DatosUtm) : null;
  } catch {
    return null;
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
