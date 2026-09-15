"use client";

import { idDeEvento, type EventoMeta } from "./meta-eventos";

/**
 * Pixel de Meta (navegador). Complementa a lib/meta-capi.ts: los eventos
 * que sobreviven al bloqueo llegan por aquí, el resto por servidor, y el
 * event_id compartido evita que Meta los cuente dos veces.
 *
 * Sin NEXT_PUBLIC_META_PIXEL_ID es un no-op, igual que lib/analytics.ts.
 */

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const EVENTOS_ESTANDAR: ReadonlySet<EventoMeta> = new Set(["Lead"]);

export function pixelId(): string | undefined {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID;
}

/** Carga el script del pixel una sola vez y dispara el PageView inicial. */
export function iniciarPixel(): void {
  const id = pixelId();
  if (!id || typeof window === "undefined" || window.fbq) return;

  // Stub oficial de Meta: encola los eventos disparados antes de que el
  // script termine de cargar, para no perder los primeros.
  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue?.push(args);
  } as Fbq;
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", id);
  window.fbq("track", "PageView");
}

/**
 * Dispara un evento. `idBase` es el de la sesión de diagnóstico: el
 * event_id derivado debe coincidir con el que manda el servidor.
 */
export function trackPixel(
  evento: EventoMeta,
  idBase: string,
  propiedades?: Record<string, string | number | null | undefined>
): void {
  if (!pixelId() || typeof window === "undefined" || !window.fbq) return;

  const datos: Record<string, string | number> = {};
  for (const [clave, valor] of Object.entries(propiedades ?? {})) {
    if (valor !== null && valor !== undefined) datos[clave] = valor;
  }

  window.fbq(
    EVENTOS_ESTANDAR.has(evento) ? "track" : "trackCustom",
    evento,
    datos,
    { eventID: idDeEvento(idBase, evento) }
  );
}
