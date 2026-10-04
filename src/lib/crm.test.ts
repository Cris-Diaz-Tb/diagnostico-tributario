import { afterEach, describe, expect, it } from "vitest";
import {
  camposDeContacto,
  camposDeOportunidad,
  etiquetasDeLead,
  type LeadParaCrm,
} from "./crm";

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

  it("marcan el rango de propiedades y si es avatar", () => {
    const etiquetas = etiquetasDeLead({ ...LEAD, propiedadesRango: "5_10", avatar: true });
    expect(etiquetas).toContain("diag-propiedades-5_10");
    expect(etiquetas).toContain("diag-avatar-si");
    expect(etiquetasDeLead({ ...LEAD, avatar: false })).toContain("diag-avatar-no");
  });

  it("marcan a los leads del lanzamiento y no tocan los del directo", () => {
    expect(etiquetasDeLead({ ...LEAD, origen: "lanzamiento-2026-10" })).toContain(
      "lanzamiento-oct26"
    );
    expect(etiquetasDeLead({ ...LEAD, origen: "directo" })).toEqual(etiquetasDeLead(LEAD));
  });

  it("omite las etiquetas de clasificación que no existen", () => {
    const etiquetas = etiquetasDeLead({ ...LEAD, problema: null, nivelIntencion: null });
    expect(etiquetas).toHaveLength(4);
  });
});

describe("campos personalizados de GoHighLevel", () => {
  const ENV = { ...process.env };
  afterEach(() => {
    process.env = { ...ENV };
  });

  const CON_DATOS: LeadParaCrm = {
    ...LEAD,
    datos: {
      codigo: "1234ABCD",
      etapa: "Inversionista intermedio, etapa 2 de 3 (B2)",
      problemaTexto: "Sociedad de inversiones",
      intencionTexto: "Contenido gratis",
      ofertaNombre: "Asesoría de sociedad",
      urlAgenda: "https://agenda.ejemplo.cl/?canal=whatsapp",
      contexto: "Código: 1234ABCD",
    },
  };

  it("solo envía los campos con id configurado", () => {
    process.env.GHL_CAMPO_CODIGO = "idCodigo";
    process.env.GHL_CAMPO_CONTEXTO = " idContexto ";
    delete process.env.GHL_CAMPO_FASE;
    expect(camposDeContacto(CON_DATOS)).toEqual(
      expect.arrayContaining([
        { id: "idCodigo", field_value: "1234ABCD" },
        { id: "idContexto", field_value: "Código: 1234ABCD" },
      ])
    );
    expect(camposDeContacto(CON_DATOS).some((c) => c.id === "")).toBe(false);
  });

  it("la oportunidad usa sus propios ids", () => {
    process.env.GHL_CAMPO_CODIGO = "idContactoCodigo";
    process.env.GHL_CAMPO_OPP_CODIGO = "idOppCodigo";
    process.env.GHL_CAMPO_OPP_ETAPA = "idOppEtapa";
    const campos = camposDeOportunidad(CON_DATOS);
    expect(campos).toContainEqual({ id: "idOppCodigo", field_value: "1234ABCD" });
    expect(campos).toContainEqual({
      id: "idOppEtapa",
      field_value: "Inversionista intermedio, etapa 2 de 3 (B2)",
    });
    expect(campos.some((c) => c.id === "idContactoCodigo")).toBe(false);
  });
});
