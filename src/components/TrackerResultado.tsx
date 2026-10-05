"use client";

import { useEffect } from "react";
import { trackEvento } from "@/lib/analytics";
import { trackPixel } from "@/lib/meta-pixel";
import { idBaseDeSesion, tomarCompletadoPendiente } from "@/lib/sesion-diagnostico";
import type { FaseId } from "@/content/tipos";

export function TrackerResultado({ fase, token }: { fase: FaseId; token: string }) {
  useEffect(() => {
    trackEvento("resultado_visitado", { fase });
    // Solo la primera llegada desde el gate; el servidor manda el mismo
    // event_id al capturar el correo y Meta los une.
    const completado = tomarCompletadoPendiente(token);
    if (completado) trackPixel("DiagnosticoCompletado", idBaseDeSesion(), completado);
  }, [fase, token]);
  return null;
}
