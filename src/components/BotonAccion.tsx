"use client";

import type { ReactNode } from "react";
import { trackEvento } from "@/lib/analytics";
import { trackPixelPersonalizado } from "@/lib/meta-pixel";
import type { AccionResultado } from "@/lib/accion-resultado";
import type { FaseId } from "@/content/tipos";

/**
 * Enlace de "Tu siguiente paso" que mide el clic: PostHog, pixel de Meta
 * (evento personalizado) y la columna accion_resultado del diagnóstico.
 * Todo es best-effort: nada de esto puede frenar la navegación.
 */
export function BotonAccion({
  href,
  accion,
  token,
  fase,
  className,
  children,
}: {
  href: string;
  accion: AccionResultado;
  token: string;
  fase: FaseId;
  className: string;
  children: ReactNode;
}) {
  function registrar() {
    trackEvento(accion, { fase });
    trackPixelPersonalizado(accion, { fase });
    try {
      const cuerpo = JSON.stringify({ token, accion });
      // sendBeacon sobrevive a la navegación; fetch keepalive de respaldo.
      if (!navigator.sendBeacon?.("/api/resultado/accion", cuerpo)) {
        void fetch("/api/resultado/accion", { method: "POST", body: cuerpo, keepalive: true });
      }
    } catch {
      // Sin registro, pero el enlace abre igual.
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={registrar}
      className={className}
    >
      {children}
    </a>
  );
}
