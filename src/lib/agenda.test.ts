import { afterEach, describe, expect, it } from "vitest";
import { codigoCorto, URL_AGENDA, urlAsesoria } from "./agenda";
import { invalidarCacheConfig } from "./configuracion";

const ORIGINAL = process.env.NEXT_PUBLIC_URL_ASESORIA;
afterEach(() => {
  process.env.NEXT_PUBLIC_URL_ASESORIA = ORIGINAL;
  invalidarCacheConfig();
});

describe("enlace de asesoría", () => {
  it("sin configurar lleva a la agenda propia", async () => {
    delete process.env.NEXT_PUBLIC_URL_ASESORIA;
    const url = new URL((await urlAsesoria("1234abcd-uuid", "A2"))!);
    expect(`${url.origin}${url.pathname}`).toBe(URL_AGENDA);
    expect(url.searchParams.get("diagnostico")).toBe("1234abcd-uuid");
    expect(url.searchParams.get("codigo")).toBe("1234ABCD");
    expect(url.searchParams.get("fase")).toBe("A2");
  });

  it("sin fase conocida igual agenda, solo sin ese dato", async () => {
    delete process.env.NEXT_PUBLIC_URL_ASESORIA;
    const url = new URL((await urlAsesoria("id-123"))!);
    expect(url.searchParams.has("fase")).toBe(false);
    expect(url.searchParams.get("diagnostico")).toBe("id-123");
  });

  it("un enlace de WhatsApp se ignora y se agenda igual", async () => {
    process.env.NEXT_PUBLIC_URL_ASESORIA = "https://wa.me/56951744388";
    const url = new URL((await urlAsesoria("1234abcd-9999", "A2"))!);
    expect(url.hostname).not.toBe("wa.me");
    expect(`${url.origin}${url.pathname}`).toBe(URL_AGENDA);
    expect(url.searchParams.get("diagnostico")).toBe("1234abcd-9999");
  });

  it("api.whatsapp.com tampoco pasa", async () => {
    process.env.NEXT_PUBLIC_URL_ASESORIA = "https://api.whatsapp.com/send?phone=56951744388";
    const url = new URL((await urlAsesoria("id-123"))!);
    expect(`${url.origin}${url.pathname}`).toBe(URL_AGENDA);
  });

  it("otro calendario o link de pago sí se respeta, y conserva lo que traía", async () => {
    process.env.NEXT_PUBLIC_URL_ASESORIA = "https://pago.ejemplo.cl/asesoria?plan=1";
    const url = new URL((await urlAsesoria("id-123", "C3"))!);
    expect(url.hostname).toBe("pago.ejemplo.cl");
    expect(url.searchParams.get("plan")).toBe("1");
    expect(url.searchParams.get("diagnostico")).toBe("id-123");
    expect(url.searchParams.get("fase")).toBe("C3");
  });

  it("una URL inválida no rompe: oculta el enlace", async () => {
    process.env.NEXT_PUBLIC_URL_ASESORIA = "no es una url";
    expect(await urlAsesoria("id")).toBeNull();
  });

  it("el código corto ignora el prefijo demo", () => {
    expect(codigoCorto("demo-A2-xyz98765")).toBe("A2-XYZ98");
  });
});
