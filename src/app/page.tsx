import type { Viewport } from "next";
import { COPY } from "@/content/copy";
import { Portada } from "@/components/Portada";

export const viewport: Viewport = { themeColor: "#0A0F16" };

export default function Landing() {
  return <Portada textos={COPY.landing} hrefDiagnostico="/diagnostico" />;
}
