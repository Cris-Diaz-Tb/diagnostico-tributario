import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { _internos, _pruebaInternos } from "./meta-capi";
import { idDeEvento, nuevoIdBase } from "./meta-eventos";
import { construirFbc } from "./utm";

const { hash, hashTelefono, construirUserData } = _internos;

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

describe("normalización y hash de datos de contacto", () => {
  it("hashea en minúsculas y sin espacios sobrantes", () => {
    const esperado = sha256("cris@ejemplo.cl");
    expect(hash("  Cris@Ejemplo.CL  ")).toBe(esperado);
    expect(hash("cris@ejemplo.cl")).toBe(esperado);
  });

  it("deja fuera los valores vacíos en vez de mandar hashes de cadena vacía", () => {
    expect(hash(null)).toBeUndefined();
    expect(hash(undefined)).toBeUndefined();
    expect(hash("   ")).toBeUndefined();
  });

  it("el teléfono se reduce a dígitos antes de hashear", () => {
    const esperado = sha256("573001234567");
    expect(hashTelefono("+57 300 123 4567")).toBe(esperado);
    expect(hashTelefono("57-300-123-4567")).toBe(esperado);
    expect(hashTelefono("sin numeros")).toBeUndefined();
  });
});

describe("user_data que se envía a Meta", () => {
  it("nunca incluye el dato de contacto en claro", () => {
    const datos = construirUserData({
      email: "cris@ejemplo.cl",
      telefono: "+57 300 123 4567",
      nombre: "Carolina Rojas",
    });
    const serializado = JSON.stringify(datos);

    expect(serializado).not.toContain("cris@ejemplo.cl");
    expect(serializado).not.toContain("3001234567");
    expect(serializado).not.toContain("Carolina");
  });

  it("separa nombre y apellido en campos distintos", () => {
    const datos = construirUserData({ nombre: "Carolina Rojas" });
    expect(datos.fn).toBe(sha256("carolina"));
    expect(datos.ln).toBe(sha256("rojas"));
  });

  it("con un solo nombre no manda apellido vacío", () => {
    const datos = construirUserData({ nombre: "Carolina" });
    expect(datos.fn).toBe(sha256("carolina"));
    expect(datos).not.toHaveProperty("ln");
  });

  it("las cookies del pixel y la IP viajan sin hashear (Meta las exige así)", () => {
    const datos = construirUserData({
      fbp: "fb.1.1700000000000.123456",
      fbc: "fb.1.1700000000000.ABC",
      ip: "190.0.0.1",
      userAgent: "Mozilla/5.0",
    });
    expect(datos.fbp).toBe("fb.1.1700000000000.123456");
    expect(datos.client_ip_address).toBe("190.0.0.1");
    expect(datos.client_user_agent).toBe("Mozilla/5.0");
  });

  it("no manda claves nulas: Meta rechaza el evento si vienen", () => {
    const datos = construirUserData({ email: "a@b.co" });
    for (const valor of Object.values(datos)) {
      expect(valor).toBeDefined();
    }
    expect(datos).not.toHaveProperty("ph");
  });
});

describe("deduplicación pixel ↔ API de Conversiones", () => {
  it("el mismo hecho produce el mismo event_id en ambos lados", () => {
    const base = "sesion-abc";
    expect(idDeEvento(base, "Lead")).toBe(idDeEvento(base, "Lead"));
  });

  it("eventos distintos de la misma sesión no colisionan", () => {
    const base = "sesion-abc";
    const ids = new Set([
      idDeEvento(base, "Lead"),
      idDeEvento(base, "DiagnosticoIniciado"),
      idDeEvento(base, "DiagnosticoCompletado"),
      idDeEvento(base, "DiagnosticoAbandonado"),
    ]);
    expect(ids.size).toBe(4);
  });

  it("cada sesión tiene su propio id base", () => {
    expect(nuevoIdBase()).not.toBe(nuevoIdBase());
  });
});

describe("reconstrucción de _fbc desde fbclid", () => {
  it("usa el formato exacto que espera Meta", () => {
    expect(construirFbc("IwAR123abc", 1700000000000)).toBe(
      "fb.1.1700000000000.IwAR123abc"
    );
  });
});

describe("prueba de credenciales del panel", () => {
  it("reconoce el error de array vacío como credenciales válidas", () => {
    const { esErrorDeArrayVacio } = _pruebaInternos;
    expect(esErrorDeArrayVacio("(#100) param data must be non-empty.")).toBe(true);
    expect(esErrorDeArrayVacio("(#100) param data is required")).toBe(true);
  });

  it("no confunde un problema de permisos con el array vacío", () => {
    const { esErrorDeArrayVacio } = _pruebaInternos;
    expect(esErrorDeArrayVacio("(#100) Missing Permission")).toBe(false);
    expect(esErrorDeArrayVacio("Invalid OAuth access token")).toBe(false);
    expect(esErrorDeArrayVacio("(#190) Error validating access token")).toBe(false);
  });
});
