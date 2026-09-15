import { afterEach, describe, expect, it } from "vitest";
import { codigoCorto, urlAsesoria } from "./agenda";

const ORIGINAL = process.env.NEXT_PUBLIC_URL_ASESORIA;
afterEach(() => {
  process.env.NEXT_PUBLIC_URL_ASESORIA = ORIGINAL;
});

describe("enlace de asesoría", () => {
  it("sin variable no muestra enlace", () => {
    delete process.env.NEXT_PUBLIC_URL_ASESORIA;
    expect(urlAsesoria("1234abcd-uuid", "Patrimonio a la deriva")).toBeNull();
  });

  it("en WhatsApp prellena el mensaje con resultado y código corto", () => {
    process.env.NEXT_PUBLIC_URL_ASESORIA = "https://wa.me/56912345678";
    const url = new URL(urlAsesoria("1234abcd-9999", "Patrimonio a la deriva")!);
    expect(url.hostname).toBe("wa.me");
    expect(url.searchParams.get("text")).toContain("Patrimonio a la deriva");
    expect(url.searchParams.get("text")).toContain("1234ABCD");
  });

  it("en otra URL añade el id del diagnóstico", () => {
    process.env.NEXT_PUBLIC_URL_ASESORIA = "https://pago.ejemplo.cl/asesoria?plan=1";
    const url = new URL(urlAsesoria("id-123", "X")!);
    expect(url.searchParams.get("plan")).toBe("1");
    expect(url.searchParams.get("diagnostico")).toBe("id-123");
  });

  it("una URL inválida no rompe: oculta el enlace", () => {
    process.env.NEXT_PUBLIC_URL_ASESORIA = "no es una url";
    expect(urlAsesoria("id", "X")).toBeNull();
  });

  it("el código corto ignora el prefijo demo", () => {
    expect(codigoCorto("demo-A2-xyz98765")).toBe("A2-XYZ98");
  });
});
