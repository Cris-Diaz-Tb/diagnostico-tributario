import { COPY } from "@/content/copy";
import { Portada } from "@/components/Portada";

export default function PortadaLanzamiento() {
  return (
    <Portada
      textos={{ ...COPY.landing, ...COPY.lanzamiento }}
      hrefDiagnostico="/brecha-estructural/diagnostico"
    />
  );
}
