import { describe, expect, it } from "vitest";
import { ctaEfectivo, FASES, ROADMAPS } from "./roadmaps";
import { OFERTAS, ofertaRecomendada } from "./ofertas";
import { COPY } from "./copy";
import { PREGUNTA_BIFURCACION, preguntasDeRuta, RUTAS } from "./preguntas";
import type { TagProblema } from "./tipos";

const TAGS: TagProblema[] = ["pago_de_mas", "notificacion_sii", "comprar_mas", "sociedad", "herencia", "otro"];

/** Todo texto visible al usuario: preguntas, resultados y copy. */
function textosVisibles(): string[] {
  const textos: string[] = [PREGUNTA_BIFURCACION.texto, PREGUNTA_BIFURCACION.ayuda];
  for (const ruta of RUTAS) {
    for (const p of preguntasDeRuta(ruta)) {
      textos.push(p.texto);
      if (p.tipo !== "abierta") textos.push(...p.opciones.map((o) => o.texto));
    }
  }
  for (const r of Object.values(ROADMAPS)) {
    textos.push(r.parteA.titulo, r.parteA.diagnostico, ...r.parteB.pasos, r.parteB.cta);
    textos.push(...Object.values(r.parteB.ctaPorTag ?? {}));
  }
  const recorrer = (valor: unknown) => {
    if (typeof valor === "string") textos.push(valor);
    else if (typeof valor === "function") textos.push(String((valor as (...a: string[]) => string)("X", "Y")));
    else if (valor && typeof valor === "object") Object.values(valor).forEach(recorrer);
  };
  recorrer(COPY);
  return textos;
}

describe("los 9 resultados", () => {
  it("existen las 9 fases, cada una con título, diagnóstico y 3 pasos con contenido", () => {
    expect(FASES).toEqual(["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"]);
    for (const fase of FASES) {
      const r = ROADMAPS[fase];
      expect(r.fase).toBe(fase);
      expect(r.parteA.titulo.length).toBeGreaterThan(5);
      expect(r.parteA.diagnostico.length).toBeGreaterThan(80);
      for (const paso of r.parteB.pasos) expect(paso.length).toBeGreaterThan(40);
    }
  });

  it("sin problema marcado se usa el CTA de la fase", () => {
    for (const fase of FASES) {
      expect(ctaEfectivo(ROADMAPS[fase], null)).toBe(ROADMAPS[fase].parteB.cta);
    }
  });
});

describe("mapa fase + problema → oferta (bloque 8.2)", () => {
  it("una notificación del SII siempre recomienda regularización, en cualquier fase", () => {
    for (const fase of FASES) {
      expect(ofertaRecomendada(fase, "notificacion_sii").id).toBe("regularizacion_sii");
      expect(ctaEfectivo(ROADMAPS[fase], "notificacion_sii")).toMatch(/regularizaci/i);
    }
  });

  it("ruta C recomienda la asesoría internacional salvo el caso SII", () => {
    for (const fase of ["C1", "C2", "C3"] as const) {
      for (const tag of TAGS.filter((t) => t !== "notificacion_sii")) {
        expect(ofertaRecomendada(fase, tag).id).toBe("patrimonial_internacional");
      }
    }
  });

  it("casos específicos del documento de insumos", () => {
    expect(ofertaRecomendada("A1", "pago_de_mas").id).toBe("asesoria_patrimonial");
    expect(ofertaRecomendada("A3", "sociedad").id).toBe("sociedad_inversiones");
    expect(ofertaRecomendada("A3", "herencia").id).toBe("asesoria_patrimonial");
    expect(ofertaRecomendada("B1", "pago_de_mas").id).toBe("asesoria_patrimonial");
    expect(ofertaRecomendada("B2", "sociedad").id).toBe("sociedad_inversiones");
    expect(ofertaRecomendada("B3", "herencia").id).toBe("asesoria_patrimonial");
    expect(ctaEfectivo(ROADMAPS.A3, "herencia")).toMatch(/herencia/);
    expect(ctaEfectivo(ROADMAPS.C3, "otro")).toMatch(/conversación breve/);
  });

  it("todas las ofertas recomendadas existen en el catálogo", () => {
    for (const fase of FASES) {
      for (const tag of [...TAGS, null]) {
        expect(OFERTAS[ofertaRecomendada(fase, tag).id]).toBeDefined();
      }
    }
  });
});

describe("reglas de marca en todo texto visible", () => {
  const textos = textosVisibles();

  it("no revela precios", () => {
    for (const t of textos) {
      expect(/\$\s?\d|\bclp\b|\busd\b/i.test(t), t).toBe(false);
      for (const oferta of Object.values(OFERTAS)) {
        expect(t.includes(oferta.precioInternoClp.toLocaleString("es-CL")), t).toBe(false);
      }
    }
  });

  it("no promete resultados ni insinúa evasión", () => {
    const prohibido =
      /garantiz|cero riesgo|no pagar impuesto|evadi|evasi[oó]n|hazte rico|evitar (el )?impuesto|que no se note/i;
    for (const t of textos) expect(prohibido.test(t), t).toBe(false);
  });

  it("no usa emojis", () => {
    for (const t of textos) expect(/\p{Extended_Pictographic}/u.test(t), t).toBe(false);
  });
});
