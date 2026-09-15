import { describe, expect, it } from "vitest";
import { calcularResultado, faseDeScore, RespuestasInvalidasError } from "./scoring";
import {
  PREGUNTA_ABIERTA_ID,
  PREGUNTAS_TAG,
  preguntasDeRuta,
  RUTAS,
} from "@/content/preguntas";
import type { Pregunta, Ruta } from "@/content/tipos";
import type { Respuestas } from "./scoring";

/**
 * Escalas: rutas A y B 7-21 (7 puntuadas), ruta C 8-24 (8 puntuadas).
 * Las preguntas de etiqueta usan su primera opción que no pida detalle;
 * la abierta es opcional y se omite.
 */
function respuestasPorIndice(preguntas: Pregunta[], indice: number): Respuestas {
  const respuestas: Respuestas = {};
  for (const p of preguntas) {
    if (p.tipo === "abierta") continue;
    if (p.tipo === "tag") {
      respuestas[p.id] = p.opciones[0].id;
      continue;
    }
    respuestas[p.id] = p.opciones[indice].id;
  }
  return respuestas;
}

const ESCALA: Record<Ruta, { puntuadas: number; cortes: [number, number, number] }> = {
  A: { puntuadas: 7, cortes: [11, 16, 21] },
  B: { puntuadas: 7, cortes: [11, 16, 21] },
  C: { puntuadas: 8, cortes: [13, 19, 24] },
};

describe.each(RUTAS)("Ruta %s", (ruta) => {
  const preguntas = preguntasDeRuta(ruta);
  const { puntuadas, cortes } = ESCALA[ruta];

  it("tiene la cantidad de preguntas puntuadas del documento de insumos", () => {
    expect(preguntas.filter((p) => p.tipo === "puntuada")).toHaveLength(puntuadas);
  });

  it("cada puntuada tiene 3 opciones ordenadas de 1 a 3 puntos", () => {
    for (const p of preguntas) {
      if (p.tipo !== "puntuada") continue;
      expect(p.opciones.map((o) => o.puntos)).toEqual([1, 2, 3]);
    }
  });

  it("termina con problema principal, nivel de intención y pregunta abierta", () => {
    const ultimas = preguntas.slice(-3).map((p) => p.id);
    expect(ultimas).toEqual([
      PREGUNTAS_TAG[ruta].problema,
      PREGUNTAS_TAG[ruta].intencion,
      PREGUNTA_ABIERTA_ID[ruta],
    ]);
  });

  it("mínimo: todo 1 punto cae en la etapa 1", () => {
    const r = calcularResultado(ruta, respuestasPorIndice(preguntas, 0));
    expect(r.score).toBe(puntuadas);
    expect(r.fase).toBe(`${ruta}1`);
  });

  it("todo 2 puntos cae en la etapa 2", () => {
    const r = calcularResultado(ruta, respuestasPorIndice(preguntas, 1));
    expect(r.score).toBe(puntuadas * 2);
    expect(r.fase).toBe(`${ruta}2`);
  });

  it("máximo: todo 3 puntos cae en la etapa 3", () => {
    const r = calcularResultado(ruta, respuestasPorIndice(preguntas, 2));
    expect(r.score).toBe(puntuadas * 3);
    expect(r.fase).toBe(`${ruta}3`);
  });

  it("respeta los cortes exactos de cada fase", () => {
    const [c1, c2] = cortes;
    expect(faseDeScore(ruta, puntuadas)).toBe(`${ruta}1`);
    expect(faseDeScore(ruta, c1)).toBe(`${ruta}1`);
    expect(faseDeScore(ruta, c1 + 1)).toBe(`${ruta}2`);
    expect(faseDeScore(ruta, c2)).toBe(`${ruta}2`);
    expect(faseDeScore(ruta, c2 + 1)).toBe(`${ruta}3`);
    expect(faseDeScore(ruta, puntuadas * 3)).toBe(`${ruta}3`);
  });
});

describe("preguntas de clasificación", () => {
  it("guardan problema principal e intención sin alterar el score", () => {
    const base = respuestasPorIndice(preguntasDeRuta("A"), 1);
    const r = calcularResultado("A", { ...base, a8: "herencia", a9: "compro_producto" });
    expect(r.score).toBe(14);
    expect(r.tag).toBe("herencia");
    expect(r.nivelIntencion).toBe("compro_producto");
  });

  it("'Otra cosa' exige detalle escrito", () => {
    const respuestas = { ...respuestasPorIndice(preguntasDeRuta("B"), 0), b8: "otro" };
    expect(() => calcularResultado("B", respuestas)).toThrow(RespuestasInvalidasError);
    expect(() => calcularResultado("B", respuestas, { b8: "   " })).toThrow(
      RespuestasInvalidasError
    );
    const r = calcularResultado("B", respuestas, { b8: "  Heredé un terreno  " });
    expect(r.problemaOtro).toBe("Heredé un terreno");
  });

  it("recorta el detalle de 'Otra cosa' a 300 caracteres", () => {
    const respuestas = { ...respuestasPorIndice(preguntasDeRuta("C"), 0), c9: "otro" };
    const r = calcularResultado("C", respuestas, { c9: "x".repeat(500) });
    expect(r.problemaOtro).toHaveLength(300);
  });

  it("la pregunta abierta es opcional y se recorta a su largo máximo", () => {
    const sin = calcularResultado("A", respuestasPorIndice(preguntasDeRuta("A"), 0));
    expect(sin.textoAbierto).toBeNull();
    const con = calcularResultado("A", respuestasPorIndice(preguntasDeRuta("A"), 0), {
      a10: "y".repeat(900),
    });
    expect(con.textoAbierto).toHaveLength(500);
  });
});

describe("validación", () => {
  it("falla si falta una pregunta obligatoria", () => {
    const respuestas = respuestasPorIndice(preguntasDeRuta("A"), 0);
    delete respuestas.a4;
    expect(() => calcularResultado("A", respuestas)).toThrow(RespuestasInvalidasError);
  });

  it("falla si falta el problema principal", () => {
    const respuestas = respuestasPorIndice(preguntasDeRuta("C"), 0);
    delete respuestas.c9;
    expect(() => calcularResultado("C", respuestas)).toThrow(RespuestasInvalidasError);
  });

  it("falla con una opción que no existe", () => {
    const respuestas = { ...respuestasPorIndice(preguntasDeRuta("B"), 0), b1: "b1_9" };
    expect(() => calcularResultado("B", respuestas)).toThrow(RespuestasInvalidasError);
  });

  it("no acepta respuestas de otra ruta como válidas", () => {
    expect(() =>
      calcularResultado("B", respuestasPorIndice(preguntasDeRuta("A"), 0))
    ).toThrow(RespuestasInvalidasError);
  });
});
