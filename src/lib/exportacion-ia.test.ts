import { describe, expect, it } from "vitest";
import { DIAGNOSTICOS_DEMO } from "./demo-data";
import { exportarJsonl, exportarMarkdown, registroParaIA, type FilaIA } from "./exportacion-ia";

const capturado = DIAGNOSTICOS_DEMO.find((d) => d.estado_efectivo === "capturado") as FilaIA;
const gate = DIAGNOSTICOS_DEMO.find((d) => d.estado_efectivo === "abandono_gate") as FilaIA;

describe("exportación para IA", () => {
  it("sin la opción de contacto no exporta nombre, email ni teléfono", () => {
    const md = exportarMarkdown([capturado], false);
    const jsonl = exportarJsonl([capturado], false);
    for (const dato of [capturado.email!, capturado.telefono!]) {
      expect(md).not.toContain(dato);
      expect(jsonl).not.toContain(dato);
    }
    expect(registroParaIA(capturado, false).contacto).toBeUndefined();
  });

  it("con la opción de contacto sí los incluye", () => {
    expect(registroParaIA(capturado, true).contacto?.email).toBe(capturado.email);
    expect(exportarMarkdown([capturado], true)).toContain(capturado.email!);
  });

  it("pone la pregunta completa junto a cada respuesta y traduce las etiquetas", () => {
    const registro = registroParaIA(gate, false);
    expect(registro.segmento).toMatch(/gate/);
    expect(registro.respuestas[1].pregunta).toBe(gate.respuestas![0].pregunta);
    expect(registro.respuestas[1].respuesta).toBe(gate.respuestas![0].opcion);
    expect(registro.fase_titulo).toBeTruthy();
    expect(registro.oferta_recomendada).not.toMatch(/_/);
  });

  it("incluye el rango de propiedades, la pregunta que define la ruta y si es avatar", () => {
    const fila = { ...gate, ruta: "B" as const, propiedades_rango: "5_10" };
    const registro = registroParaIA(fila, false);
    expect(registro.propiedades).toBe("Entre 5 y 10 propiedades");
    expect(registro.avatar).toBe("Sí");
    expect(registro.respuestas[0]).toEqual({
      pregunta: "¿Cuántas propiedades tienes hoy?",
      respuesta: "Entre 5 y 10 propiedades",
    });
    const md = exportarMarkdown([fila], false);
    expect(md).toContain("**Propiedades:** Entre 5 y 10 propiedades");
    expect(md).toContain("Avatar (5 propiedades o más): 1");
  });

  it("los diagnósticos sin rango muestran la opción anterior", () => {
    const viejoA = registroParaIA({ ...gate, ruta: "A", propiedades_rango: null }, false);
    expect(viejoA.propiedades).toBe("Hasta 5 propiedades");
    expect(viejoA.avatar).toMatch(/Sin dato/);
    const viejoB = registroParaIA({ ...gate, ruta: "B", propiedades_rango: null }, false);
    expect(viejoB.avatar).toBe("Sí");
  });

  it("marca las pruebas internas", () => {
    expect(registroParaIA({ ...gate, es_prueba: true }, false).es_prueba).toBe(true);
    expect(exportarMarkdown([{ ...gate, es_prueba: true }], false)).toContain("Prueba interna");
    expect(registroParaIA(gate, false).es_prueba).toBe(false);
  });

  it("JSONL tiene una línea parseable por diagnóstico", () => {
    const lineas = exportarJsonl([capturado, gate], false).trim().split("\n");
    expect(lineas).toHaveLength(2);
    expect(lineas.map((l) => JSON.parse(l).codigo)).toEqual([
      capturado.id.slice(0, 8).toUpperCase(),
      gate.id.slice(0, 8).toUpperCase(),
    ]);
  });

  it("el Markdown cuenta cada segmento en el encabezado", () => {
    const md = exportarMarkdown([capturado, gate, gate], false);
    expect(md).toContain("Completó y dejó sus datos: 1");
    expect(md).toContain("(abandonó en el gate): 2");
  });
});
