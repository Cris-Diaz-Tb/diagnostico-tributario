import { describe, expect, it } from "vitest";
import { digitosDeTelefono, telefonoValido } from "./telefono";

describe("WhatsApp del lead", () => {
  it("acepta las formas en que la gente escribe su número", () => {
    for (const valor of [
      "+56 9 1234 5678",
      "+56912345678",
      "56912345678",
      "9 1234 5678",
      "912345678",
      "(56) 9-1234-5678",
    ]) {
      expect(telefonoValido(valor), valor).toBe(true);
    }
  });

  it("rechaza vacío, basura y números demasiado cortos o largos", () => {
    for (const valor of ["", "   ", "no tengo", "1234567", "1".repeat(16)]) {
      expect(telefonoValido(valor), JSON.stringify(valor)).toBe(false);
    }
    expect(telefonoValido(null)).toBe(false);
    expect(telefonoValido(undefined)).toBe(false);
  });

  it("deja solo dígitos, que es lo que Meta hashea", () => {
    expect(digitosDeTelefono("+56 9 1234 5678")).toBe("56912345678");
  });
});
