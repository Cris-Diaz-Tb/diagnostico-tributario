"use client";

import { useEffect, useRef } from "react";
import { trackEvento } from "@/lib/analytics";
import { trackPixel } from "@/lib/meta-pixel";
import type { FaseId } from "@/content/tipos";

/**
 * Llegar a esta página es haber dejado los datos y ver el diagnóstico
 * completo: cada visita dispara DiagnosticoCompletado. El event_id sale
 * del diagnóstico (no de la pestaña), así que es el mismo que manda el
 * servidor al capturar el correo y el mismo en cada visita: Meta los une
 * y no lo cuenta doble.
 */
export function TrackerResultado({
  fase,
  eventoId,
}: {
  fase: FaseId;
  eventoId: string | null;
}) {
  // Una vez por carga, aunque React monte el efecto dos veces.
  const enviado = useRef(false);
  useEffect(() => {
    if (enviado.current) return;
    enviado.current = true;
    trackEvento("resultado_visitado", { fase });
    if (eventoId) trackPixel("DiagnosticoCompletado", eventoId, { fase });
  }, [fase, eventoId]);
  return null;
}
