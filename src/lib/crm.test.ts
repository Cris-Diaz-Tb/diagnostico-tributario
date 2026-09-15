import { describe, expect, it } from "vitest";
import { etiquetasDeLead, type LeadParaCrm } from "./crm";

const LEAD: LeadParaCrm = {
  email: "carolina@ejemplo.cl",
  nombre: "Carolina",
  telefono: null,
  ruta: "B",
  fase: "B2",
  score: 14,
  problema: "sociedad",
  nivelIntencion: "contenido_gratis",
  oferta: "sociedad_inversiones",
  urlResultado: "https://diagnostico.ejemplo.cl/resultado/abc",
};

describe("etiquetas de GoHighLevel", () => {
  it("describen ruta, fase, oferta, problema e intención", () => {
    expect(etiquetasDeLead(LEAD)).toEqual([
      "diagnostico",
      "diag-ruta-b",
      "diag-fase-b2",
      "diag-oferta-sociedad_inversiones",
      "diag-problema-sociedad",
      "diag-intencion-contenido_gratis",
    ]);
  });

  it("omite las etiquetas de clasificación que no existen", () => {
    const etiquetas = etiquetasDeLead({ ...LEAD, problema: null, nivelIntencion: null });
    expect(etiquetas).toHaveLength(4);
  });
});
