import { describe, expect, it } from "vitest";
import {
  PREGUNTA_BIFURCACION,
  RANGOS_PROPIEDADES,
  esAvatar,
  rangoDePropiedades,
} from "./preguntas";

describe("rangos de propiedades", () => {
  it("la pregunta de entrada ofrece los 5 rangos", () => {
    expect(PREGUNTA_BIFURCACION.opciones.map((o) => o.id)).toEqual([
      "1_4",
      "5_10",
      "11_15",
      "16_30",
      "mas_30",
    ]);
  });

  it("el avatar empieza en 5 propiedades y la ruta A queda solo para 1 a 4", () => {
    for (const r of RANGOS_PROPIEDADES) {
      expect(r.avatar).toBe(r.id !== "1_4");
      expect(r.ruta === "A").toBe(r.id === "1_4");
    }
    expect(rangoDePropiedades("5_10")?.ruta).toBe("B");
  });

  it("calcula el avatar con rango y, sin él, según la ruta antigua", () => {
    expect(esAvatar("A", "1_4")).toBe(false);
    expect(esAvatar("B", "5_10")).toBe(true);
    expect(esAvatar("A", null)).toBeNull();
    expect(esAvatar("C", null)).toBe(true);
    expect(rangoDePropiedades("inventado")).toBeNull();
  });
});
