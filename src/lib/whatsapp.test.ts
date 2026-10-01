import { afterEach, describe, expect, it } from "vitest";
import { extraerCodigo, mensajeWhatsapp, urlWhatsapp } from "./whatsapp";
import { invalidarCacheConfig } from "./configuracion";

const ORIGINAL = process.env.WHATSAPP_NUMERO;
afterEach(() => {
  process.env.WHATSAPP_NUMERO = ORIGINAL;
  invalidarCacheConfig();
});

describe("enlace de WhatsApp", () => {
  it("sin número configurado no hay botón", async () => {
    delete process.env.WHATSAPP_NUMERO;
    expect(await urlWhatsapp("1234abcd-uuid", "A2")).toBeNull();
  });

  it("abre el chat de Cris con etapa y código en el mensaje", async () => {
    process.env.WHATSAPP_NUMERO = "+56 9 5174 4388";
    const url = new URL((await urlWhatsapp("1234abcd-uuid", "A2"))!);
    expect(url.origin + url.pathname).toBe("https://wa.me/56951744388");
    const texto = url.searchParams.get("text")!;
    expect(texto).toContain("etapa 2 de 3 (A2)");
    expect(texto).toContain("1234ABCD");
  });

  it("el código del mensaje prellenado se puede leer de vuelta", () => {
    expect(extraerCodigo(mensajeWhatsapp("C3", "ECBCD5B1"))).toBe("ECBCD5B1");
    expect(extraerCodigo(mensajeWhatsapp("B1", "53D00C54"))).toBe("53D00C54");
  });
});

describe("código en un mensaje editado", () => {
  it("lo encuentra aunque la persona cambie el texto", () => {
    expect(extraerCodigo("hola, codigo: d192269e gracias")).toBe("D192269E");
    expect(extraerCodigo("mi código es 4D105281")).toBe("4D105281");
    expect(extraerCodigo("4d105281")).toBe("4D105281");
  });

  it("devuelve null si no hay código", () => {
    expect(extraerCodigo("hola, quiero información")).toBeNull();
    expect(extraerCodigo("mi número es +56951744388")).toBeNull();
  });
});
