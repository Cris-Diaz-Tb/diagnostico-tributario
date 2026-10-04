"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { capturarMarcaPrueba, capturarUtm } from "@/lib/utm";

/**
 * Componente invisible del layout: guarda UTMs + referrer en cualquier
 * página de aterrizaje (portada, /diagnostico, resultado) y la marca de
 * prueba interna. El panel no cuenta como aterrizaje.
 */
export function CapturaUtm() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/admin")) return;
    capturarUtm();
    capturarMarcaPrueba();
  }, [path]);
  return null;
}
