import type { Metadata, Viewport } from "next";

/**
 * Entrada del lanzamiento (15 oct – 5 nov 2026). Es el link que se comparte
 * en el grupo: todo diagnóstico que nace aquí queda en su propio espacio
 * de datos (origen lanzamiento-2026-10), separado del directo.
 */
export const metadata: Metadata = {
  title: "Tu diagnóstico antes del webinar | Cris. Tributario",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0A0F16" };

export default function LayoutLanzamiento({ children }: { children: React.ReactNode }) {
  return children;
}
