import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { filaDePrueba, firmar, payloadDeFila, postWebhook } from "./webhook-datos";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("payload del webhook", () => {
  it("lleva evento, origen, contacto y la bifurcación primero", () => {
    const fila = { ...filaDePrueba(), origen: "lanzamiento-2026-10" };
    const p = payloadDeFila(fila, "diagnostico.completado", new Date("2026-10-22T12:00:00Z"));

    expect(p.evento).toBe("diagnostico.completado");
    expect(p.enviado_at).toBe("2026-10-22T12:00:00.000Z");
    expect(p.origen).toBe("lanzamiento-2026-10");
    expect(p.es_lanzamiento).toBe(true);
    expect(p.contacto).toEqual({
      nombre: "Prueba Webhook",
      email: "prueba@ejemplo.cl",
      telefono: "+56900000000",
    });
    expect(p.respuestas[0].pregunta).toBeTruthy();
    expect(p.utm.source).toBe("prueba");
    expect(p.url_resultado).toMatch(/\/resultado\/prueba$/);
    expect(p).not.toHaveProperty("segmento");
  });

  it("un origen desconocido cae al directo", () => {
    const p = payloadDeFila({ ...filaDePrueba(), origen: null }, "diagnostico.historico");
    expect(p.origen).toBe("directo");
    expect(p.es_lanzamiento).toBe(false);
  });
});

describe("envío", () => {
  it("firma el cuerpo con HMAC-SHA256 y manda el secreto", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const ok = await postWebhook("https://n8n.test/webhook", { a: 1 }, "secreto");
    expect(ok).toBe(true);

    const [, init] = fetchMock.mock.calls[0];
    const esperado = `sha256=${createHmac("sha256", "secreto").update('{"a":1}').digest("hex")}`;
    expect(init.headers["x-webhook-secret"]).toBe("secreto");
    expect(init.headers["x-firma"]).toBe(esperado);
    expect(firmar('{"a":1}', "secreto")).toBe(esperado);
  });

  it("sin secreto no manda headers de autenticación", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await postWebhook("https://n8n.test/webhook", {}, undefined);
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("x-webhook-secret");
  });

  it("reintenta una vez ante un 5xx, no ante un 4xx", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const con500 = vi.fn().mockResolvedValue(new Response("", { status: 502 }));
    vi.stubGlobal("fetch", con500);
    expect(await postWebhook("https://n8n.test/webhook", {}, undefined)).toBe(false);
    expect(con500).toHaveBeenCalledTimes(2);

    const con404 = vi.fn().mockResolvedValue(new Response("", { status: 404 }));
    vi.stubGlobal("fetch", con404);
    expect(await postWebhook("https://n8n.test/webhook", {}, undefined)).toBe(false);
    expect(con404).toHaveBeenCalledTimes(1);
  });

  it("un fallo de red no lanza", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("caído")));
    await expect(postWebhook("https://n8n.test/webhook", {}, undefined)).resolves.toBe(false);
  });
});
