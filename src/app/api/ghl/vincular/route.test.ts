import { afterEach, describe, expect, it } from "vitest";
import { POST } from "./route";

const ORIGINAL = process.env.GHL_WEBHOOK_SECRET;
afterEach(() => {
  process.env.GHL_WEBHOOK_SECRET = ORIGINAL;
});

function peticion(cuerpo: unknown, { secreto, ip = "10.0.0.1" }: { secreto?: string; ip?: string } = {}) {
  return new Request(`https://diag.ejemplo.cl/api/ghl/vincular${secreto ? `?secreto=${secreto}` : ""}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(cuerpo),
  });
}

describe("webhook de vinculación desde WhatsApp", () => {
  it("queda deshabilitado sin secreto configurado", async () => {
    delete process.env.GHL_WEBHOOK_SECRET;
    const res = await POST(peticion({ contact_id: "c1" }, { secreto: "x" }));
    expect(res.status).toBe(503);
  });

  it("rechaza un secreto incorrecto o ausente", async () => {
    process.env.GHL_WEBHOOK_SECRET = "secreto-correcto";
    expect((await POST(peticion({ contact_id: "c1" }, { secreto: "otro" }))).status).toBe(401);
    expect((await POST(peticion({ contact_id: "c1" }))).status).toBe(401);
  });

  it("exige el contacto de GHL", async () => {
    process.env.GHL_WEBHOOK_SECRET = "secreto-correcto";
    const res = await POST(peticion({ message: { body: "código 1234ABCD" } }, { secreto: "secreto-correcto" }));
    expect(res.status).toBe(400);
  });

  it("sin código en el mensaje responde 200 para que GHL no reintente", async () => {
    process.env.GHL_WEBHOOK_SECRET = "secreto-correcto";
    const res = await POST(
      peticion({ contact_id: "c1", message: { body: "hola, quiero info" } }, { secreto: "secreto-correcto" })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ vinculado: false, motivo: "sin_codigo" });
  });
});
