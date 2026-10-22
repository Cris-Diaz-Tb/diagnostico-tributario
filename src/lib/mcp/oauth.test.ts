import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { emitirToken, enSegundos, leerToken, llaveCorrecta, pkceValido, redirectPermitido } from "./oauth";

const LLAVE = "llave-de-prueba-larga";

describe("tokens firmados", () => {
  it("se leen con la misma llave y tipo", () => {
    const t = emitirToken({ t: "acceso", ci: "dd-x", exp: enSegundos(60) }, LLAVE);
    expect(leerToken(t, "acceso", LLAVE)?.ci).toBe("dd-x");
  });

  it("rechaza otro tipo, otra llave, vencidos y alterados", () => {
    const t = emitirToken({ t: "refresco", ci: "dd-x", exp: enSegundos(60) }, LLAVE);
    expect(leerToken(t, "acceso", LLAVE)).toBeNull();
    expect(leerToken(t, "refresco", "otra-llave")).toBeNull();

    const vencido = emitirToken({ t: "acceso", ci: "dd-x", exp: enSegundos(-1) }, LLAVE);
    expect(leerToken(vencido, "acceso", LLAVE)).toBeNull();

    const [v, cuerpo, firma] = t.split(".");
    const alterado = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(cuerpo, "base64url").toString()), t: "acceso" })
    ).toString("base64url");
    expect(leerToken(`${v}.${alterado}.${firma}`, "acceso", LLAVE)).toBeNull();
    expect(leerToken("basura", "acceso", LLAVE)).toBeNull();
  });

  it("sin llave no hay tokens válidos", () => {
    const t = emitirToken({ t: "acceso", ci: "dd-x", exp: enSegundos(60) }, LLAVE);
    expect(leerToken(t, "acceso", null)).toBeNull();
  });
});

describe("PKCE y llave", () => {
  it("valida el verifier contra el challenge S256", () => {
    const verifier = "a".repeat(43) + "-._~";
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    expect(pkceValido(verifier, challenge)).toBe(true);
    expect(pkceValido("b".repeat(43), challenge)).toBe(false);
    expect(pkceValido("corto", challenge)).toBe(false);
  });

  it("compara la llave", () => {
    expect(llaveCorrecta(LLAVE, LLAVE)).toBe(true);
    expect(llaveCorrecta("otra", LLAVE)).toBe(false);
    expect(llaveCorrecta(LLAVE, null)).toBe(false);
  });
});

describe("URLs de retorno", () => {
  it("acepta claude.ai, claude.com y localhost", () => {
    expect(redirectPermitido("https://claude.ai/api/mcp/auth_callback")).toBe(true);
    expect(redirectPermitido("https://claude.com/api/mcp/auth_callback")).toBe(true);
    expect(redirectPermitido("http://localhost:6274/oauth/callback")).toBe(true);
  });

  it("rechaza todo lo demás", () => {
    expect(redirectPermitido("https://claude.ai/otra-ruta")).toBe(false);
    expect(redirectPermitido("http://claude.ai/api/mcp/auth_callback")).toBe(false);
    expect(redirectPermitido("https://claude.ai.malo.com/api/mcp/auth_callback")).toBe(false);
    expect(redirectPermitido("https://evil.com/cb")).toBe(false);
    expect(redirectPermitido("javascript:alert(1)")).toBe(false);
  });
});
