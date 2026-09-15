import type { Viewport } from "next";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Tu diagnóstico | Cris. Tributario",
};

export const viewport: Viewport = { themeColor: "#0A0F16" };

export default function PaginaDiagnostico() {
  return <Quiz />;
}
