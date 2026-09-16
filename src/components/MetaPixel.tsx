"use client";

import { useEffect } from "react";
import { iniciarPixel } from "@/lib/meta-pixel";

/**
 * Componente invisible: arranca el pixel de Meta al cargar cualquier página.
 *
 * El id se resuelve en runtime. Si existe NEXT_PUBLIC_META_PIXEL_ID (camino
 * rápido, queda incrustada en el bundle) se usa de inmediato; si no, se
 * consulta /api/config-publica, que devuelve lo configurado en el panel.
 * Así Cris puede cambiar el pixel desde /admin sin volver a desplegar.
 *
 * Dispara antes del checkbox de consentimiento a propósito: quien abandona
 * el diagnóstico nunca llega a ese checkbox, así que esperar a él haría
 * imposible medir el abandono. El tratamiento está declarado en /privacidad.
 */
export function MetaPixel() {
  useEffect(() => {
    const idDelBundle = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (idDelBundle) {
      iniciarPixel(idDelBundle);
      return;
    }

    let cancelado = false;
    fetch("/api/config-publica")
      .then((r) => (r.ok ? r.json() : null))
      .then((datos: { metaPixelId?: string | null } | null) => {
        if (!cancelado && datos?.metaPixelId) iniciarPixel(datos.metaPixelId);
      })
      .catch(() => {
        // Sin medición no pasa nada: el diagnóstico funciona igual.
      });
    return () => {
      cancelado = true;
    };
  }, []);
  return null;
}
