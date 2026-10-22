import { describe, expect, it, vi } from "vitest";
import { manejarMensaje } from "./servidor";

// Sin SUPABASE_URL las herramientas leen el dataset demo.
vi.spyOn(console, "warn").mockImplementation(() => {});

async function llamar(name: string, args: Record<string, unknown> = {}) {
  const r = await manejarMensaje({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
  const result = (r as { result: { content: { text: string }[]; isError?: boolean } }).result;
  return { error: result.isError ?? false, datos: result.isError ? result.content[0].text : JSON.parse(result.content[0].text) };
}

describe("protocolo", () => {
  it("initialize responde la versión pedida si la soporta", async () => {
    const r = await manejarMensaje({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } });
    expect(r).toMatchObject({ result: { protocolVersion: "2025-06-18", capabilities: { tools: {} } } });
  });

  it("las notificaciones no llevan respuesta y lo desconocido da error", async () => {
    expect(await manejarMensaje({ jsonrpc: "2.0", method: "notifications/initialized" })).toBeNull();
    expect(await manejarMensaje({ jsonrpc: "2.0", id: 2, method: "nada" })).toMatchObject({ error: { code: -32601 } });
  });

  it("todas las herramientas son de solo lectura y tienen esquema de objeto", async () => {
    const r = (await manejarMensaje({ jsonrpc: "2.0", id: 3, method: "tools/list" })) as {
      result: { tools: { name: string; inputSchema: { type: string }; annotations: { readOnlyHint: boolean } }[] };
    };
    expect(r.result.tools.length).toBeGreaterThanOrEqual(6);
    for (const t of r.result.tools) {
      expect(t.inputSchema.type).toBe("object");
      expect(t.annotations.readOnlyHint).toBe(true);
    }
  });
});

describe("herramientas con datos demo", () => {
  it("resumen_embudo separa los espacios", async () => {
    const { datos } = await llamar("resumen_embudo");
    expect(Object.keys(datos.espacios)).toEqual(["directo", "lanzamiento-2026-10"]);
    const d = datos.espacios.directo;
    expect(d.iniciados).toBeGreaterThan(0);
    expect(d.completados).toBeLessThanOrEqual(d.vieron_gate);
    expect(d.vieron_gate).toBeLessThanOrEqual(d.iniciados);
  });

  it("listar_diagnosticos filtra por etapa y pagina", async () => {
    const { datos } = await llamar("listar_diagnosticos", { origen: "directo", etapa: ["capturado"], limite: 3 });
    expect(datos.devueltos).toBeLessThanOrEqual(3);
    for (const d of datos.diagnosticos) expect(d.etapa).toBe("capturado");
    expect(datos.diagnosticos[0]).toHaveProperty("email");
  });

  it("listar con detalle trae las respuestas, y ver_diagnostico encuentra por código", async () => {
    const { datos } = await llamar("listar_diagnosticos", { detalle: true, etapa: ["capturado"], limite: 1 });
    const uno = datos.diagnosticos[0];
    expect(uno.respuestas.length).toBeGreaterThan(0);
    expect(uno).not.toHaveProperty("evento");

    const { datos: visto } = await llamar("ver_diagnostico", { codigo: uno.codigo });
    expect(visto.encontrados).toBeGreaterThanOrEqual(1);
    expect(visto.diagnosticos[0].codigo).toBe(uno.codigo);
  });

  it("abandono_por_pregunta y resumen_atribucion responden", async () => {
    expect((await llamar("abandono_por_pregunta", { origen: "directo" })).error).toBe(false);
    expect((await llamar("resumen_atribucion", { origen: "directo" })).error).toBe(false);
  });

  it("argumentos inválidos dan un error legible, no una excepción", async () => {
    const r = await llamar("ver_diagnostico", {});
    expect(r.error).toBe(true);
    expect(r.datos).toContain("codigo, email o telefono");
    expect((await llamar("listar_diagnosticos", { desde: "ayer" })).error).toBe(true);
  });
});
