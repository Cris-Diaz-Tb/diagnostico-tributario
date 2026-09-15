import { describe, expect, it } from "vitest";
import { detallarParcial, faseEstimada, faseEstimadaDeDetalle } from "./scoring";
import { preguntasDeRuta, RUTAS } from "@/content/preguntas";
import type { Pregunta } from "@/content/tipos";
import type { Respuestas } from "./scoring";

/** Responde las primeras `cuantas` preguntas eligiendo la opción `indice`. */
function primeras(preguntas: Pregunta[], cuantas: number, indice: number): Respuestas {
  const respuestas: Respuestas = {};
  for (const p of preguntas.slice(0, cuantas)) {
    if (p.tipo === "abierta") continue;
    respuestas[p.id] = p.opciones[Math.min(indice, p.opciones.length - 1)].id;
  }
  return respuestas;
}

describe("detallarParcial", () => {
  it("suma solo lo respondido y cuenta el total de pantallas de la ruta", () => {
    const parcial = detallarParcial("A", primeras(preguntasDeRuta("A"), 3, 0));
    expect(parcial.scoreParcial).toBe(3);
    expect(parcial.preguntasRespondidas).toBe(3);
    expect(parcial.totalPreguntas).toBe(10);
  });

  it("la ruta C tiene 11 pantallas", () => {
    expect(detallarParcial("C", { c1: "c1_1" }).totalPreguntas).toBe(11);
  });

  it("descarta ids de pregunta u opción que no existen", () => {
    const parcial = detallarParcial("B", { b1: "b1_2", b2: "opcion_falsa", zz: "b1_1" });
    expect(parcial.preguntasRespondidas).toBe(1);
    expect(parcial.scoreParcial).toBe(2);
  });

  it("el problema principal no suma pero queda como tag", () => {
    const parcial = detallarParcial("A", { a1: "a1_1", a8: "notificacion_sii" });
    expect(parcial.scoreParcial).toBe(1);
    expect(parcial.tag).toBe("notificacion_sii");
  });

  it("guarda la pregunta abierta si trae texto, y la ignora si viene vacía", () => {
    expect(detallarParcial("B", { b1: "b1_1" }, { b10: "Me da miedo el SII" }).detalle).toHaveLength(2);
    expect(detallarParcial("B", { b1: "b1_1" }, { b10: "   " }).detalle).toHaveLength(1);
  });

  it("sin respuestas válidas no cuenta nada", () => {
    expect(detallarParcial("A", {}).preguntasRespondidas).toBe(0);
    expect(detallarParcial("A", { xx: "yy" }).preguntasRespondidas).toBe(0);
  });
});

describe("faseEstimada", () => {
  it.each(RUTAS)("ruta %s: proyecta la etapa según el promedio respondido", (ruta) => {
    const preguntas = preguntasDeRuta(ruta);
    expect(faseEstimada(detallarParcial(ruta, primeras(preguntas, 4, 0)))).toBe(`${ruta}1`);
    expect(faseEstimada(detallarParcial(ruta, primeras(preguntas, 4, 2)))).toBe(`${ruta}3`);
  });

  it("devuelve null con menos de 2 puntuadas", () => {
    const preguntas = preguntasDeRuta("A");
    expect(faseEstimada(detallarParcial("A", primeras(preguntas, 1, 0)))).toBeNull();
    expect(faseEstimada(detallarParcial("A", {}))).toBeNull();
  });

  it("faseEstimadaDeDetalle coincide con faseEstimada", () => {
    const parcial = detallarParcial("C", primeras(preguntasDeRuta("C"), 5, 1));
    expect(faseEstimadaDeDetalle("C", parcial.detalle)).toBe(faseEstimada(parcial));
  });
});
