"use client";

import { useEffect } from "react";
import { capturarUtm } from "@/lib/utm";

/** Componente invisible: guarda UTMs + referrer al aterrizar en la landing. */
export function CapturaUtm() {
  useEffect(() => {
    capturarUtm();
  }, []);
  return null;
}
