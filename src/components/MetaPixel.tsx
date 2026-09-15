"use client";

import { useEffect } from "react";
import { iniciarPixel } from "@/lib/meta-pixel";

/**
 * Componente invisible: arranca el pixel de Meta al cargar cualquier página.
 *
 * Dispara antes del checkbox de consentimiento a propósito — quien abandona
 * el diagnóstico nunca llega a ese checkbox, así que esperar a él haría
 * imposible medir el abandono. El tratamiento está declarado en /privacidad
 * conforme a la Ley 1581/2012.
 */
export function MetaPixel() {
  useEffect(() => {
    iniciarPixel();
  }, []);
  return null;
}
