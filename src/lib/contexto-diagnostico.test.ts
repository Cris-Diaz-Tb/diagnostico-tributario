import { describe, expect, it } from "vitest";
import { contextoParaBot, MAX_CONTEXTO } from "./contexto-diagnostico";
import { OFERTAS } from "@/content/ofertas";

const BASE = {
  codigo: "1234ABCD",
  nombre: "Carolina",
  fase: "B2" as const,
  score: 14,
  problema: "sociedad",
  problemaOtro: null,
  nivelIntencion: "contenido_gratis",
  textoAbierto: "Tengo 8 departamentos a mi nombre",
  respuestas: [
    { preguntaId: "b1", pregunta: "¿Cómo declaras tus arriendos?", opcionId: "x", opcion: "Con un contador", puntos: 2 },
    { preguntaId: "b10", pregunta: "Cuéntanos", opcionId: "texto_libre", opcion: "duplicado", puntos: null },
  ],
};

describe("contexto para el bot", () => {
  it("trae código, etapa, problema, oferta, respuestas y el texto abierto", () => {
    const t = contextoParaBot(BASE);
    expect(t).toContain("Código: 1234ABCD");
    expect(t).toContain("etapa 2 de 3 (B2)");
    expect(t).toContain("Sociedad de inversiones");
    expect(t).toContain("¿Cómo declaras tus arriendos? → Con un contador");
    expect(t).toContain("Tengo 8 departamentos a mi nombre");
    // El texto libre no se repite como respuesta de opción.
    expect(t).not.toContain("→ duplicado");
  });

  it("no incluye precios", () => {
    const t = contextoParaBot(BASE);
    for (const o of Object.values(OFERTAS)) {
      expect(t).not.toContain(o.precioInternoClp.toLocaleString("es-CL"));
      expect(t).not.toContain(String(o.precioInternoClp));
    }
  });

  it("tolera un diagnóstico sin clasificación y respeta el tope", () => {
    const t = contextoParaBot({
      ...BASE,
      problema: null,
      nivelIntencion: null,
      textoAbierto: "x".repeat(5000),
      respuestas: null,
    });
    expect(t).toContain("Problema principal: No lo indicó");
    expect(t.length).toBeLessThanOrEqual(MAX_CONTEXTO);
  });
});
