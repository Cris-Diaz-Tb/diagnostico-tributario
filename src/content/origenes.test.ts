import { describe, expect, it } from "vitest";
import {
  IDS_ORIGEN,
  ORIGEN_DIRECTO,
  ORIGEN_LANZAMIENTO_OCT26,
  datosDeOrigen,
  origenValido,
} from "./origenes";

describe("orígenes del diagnóstico", () => {
  it("acepta solo orígenes del catálogo y cae al directo con cualquier otro", () => {
    expect(origenValido(ORIGEN_LANZAMIENTO_OCT26)).toBe(ORIGEN_LANZAMIENTO_OCT26);
    expect(origenValido("lanzamiento-inventado")).toBe(ORIGEN_DIRECTO);
    expect(origenValido(null)).toBe(ORIGEN_DIRECTO);
    expect(origenValido("toString")).toBe(ORIGEN_DIRECTO);
  });

  it("los ids cumplen el formato que exige la base de datos", () => {
    for (const id of IDS_ORIGEN) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(id.length).toBeLessThanOrEqual(40);
    }
  });

  it("solo el lanzamiento cambia el resultado y suma etiqueta en GHL", () => {
    expect(datosDeOrigen(ORIGEN_DIRECTO).esLanzamiento).toBeUndefined();
    expect(datosDeOrigen(ORIGEN_LANZAMIENTO_OCT26)).toMatchObject({
      esLanzamiento: true,
      etiquetaGhl: "lanzamiento-oct26",
    });
  });
});
