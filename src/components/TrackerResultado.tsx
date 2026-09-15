"use client";

import { useEffect } from "react";
import { trackEvento } from "@/lib/analytics";
import type { FaseId } from "@/content/tipos";

export function TrackerResultado({ fase }: { fase: FaseId }) {
  useEffect(() => {
    trackEvento("resultado_visitado", { fase });
  }, [fase]);
  return null;
}
