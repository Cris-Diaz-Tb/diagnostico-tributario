import { afterEach, describe, expect, it, vi } from "vitest";
import { manejarMensaje } from "./servidor";

// Sin SUPABASE_URL las herramientas leen el dataset demo.
vi.spyOn(console, "warn").mockImplementation(() => {});

async function llamar(name: string, args: Record<string, unknown> = {}) {
  const r = await manejarMensaje({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
  const result = (r as { result: { content: { text: string }[]; isError?: boolean } }).result;
  return { error: result.isError ?? false, datos: result.isError ? result.content[0].text : JSON.parse(result.content[0].text) };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("contexto del quiz", () => {
  it("ver_cuestionario trae preguntas con puntos y los rangos de cada fase", async () => {
    const { datos } = await llamar("ver_cuestionario", { ruta: "C" });
    const c = datos.rutas[0];
    expect(c.ruta).toBe("C");
    expect(c.preguntas.some((p: { opciones?: { puntos?: number }[] }) => p.opciones?.[0]?.puntos)).toBe(true);
    expect(c.fases.map((f: { fase: string }) => f.fase)).toEqual(["C1", "C2", "C3"]);
    expect(c.fases[1].score_desde).toBe(c.fases[0].score_hasta + 1);
    expect(datos.bifurcacion.opciones).toHaveLength(5);
  });

  it("ver_roadmaps separa lo de antes y después del gate", async () => {
    const { datos } = await llamar("ver_roadmaps", { fase: "A2" });
    expect(datos.fases[0].antes_del_gate.titulo).toBeTruthy();
    expect(datos.fases[0].despues_del_gate.pasos).toHaveLength(3);
  });

  it("ver_ofertas trae el precio interno y la regla del SII", async () => {
    const { datos } = await llamar("ver_ofertas");
    expect(datos.ofertas[0].precio_interno_clp).toBeGreaterThan(0);
    expect(datos.reglas[0]).toContain("SII");
  });

  it("ver_textos_del_sitio da el índice y luego una sección serializable", async () => {
    const { datos: indice } = await llamar("ver_textos_del_sitio");
    expect(indice.secciones.map((s: { seccion: string }) => s.seccion)).toContain("lanzamiento");
    const { datos } = await llamar("ver_textos_del_sitio", { seccion: "quiz" });
    expect(typeof datos.textos.progresoDe).toBe("string");
  });
});

describe("análisis", () => {
  it("cruzar suma el total y reparte en columnas", async () => {
    const { datos } = await llamar("cruzar", { filas: "utm_content", columnas: "etapa", origen: "directo" });
    const suma = datos.filas.reduce((s: number, f: { total: number }) => s + f.total, 0);
    expect(suma).toBe(datos.total);
    const fila = datos.filas[0];
    const enColumnas = Object.values(fila.etapa as Record<string, { n: number }>).reduce((s, c) => s + c.n, 0);
    expect(enColumnas).toBe(fila.total);
  });

  it("cruzar acepta respuesta:<pregunta> y rechaza variables desconocidas", async () => {
    expect((await llamar("cruzar", { filas: "respuesta:a1", columnas: "completo" })).error).toBe(false);
    expect((await llamar("cruzar", { filas: "color_favorito" })).error).toBe(true);
  });

  it("comparar_periodos compara lanzamiento contra directo", async () => {
    const { datos } = await llamar("comparar_periodos", {
      a: { origen: "directo", desde: "2026-01-01", hasta: "2026-12-31" },
      b: { origen: "lanzamiento-2026-10", desde: "2026-01-01", hasta: "2026-12-31" },
    });
    const m = datos.metricas.iniciados;
    expect(m.diferencia_b_menos_a).toBe(m.b - m.a);
    expect(datos.a).toContain("Diagnóstico directo");
  });
});

describe("GoHighLevel", () => {
  it("sin credenciales responde un error legible", async () => {
    vi.stubEnv("GHL_API_TOKEN", "");
    const { datos } = await llamar("estado_en_ghl", { email: "x@y.cl" });
    expect(datos.error).toContain("GoHighLevel");
  });

  it("arma contacto, oportunidad con nombres de etapa y conversación, solo leyendo", async () => {
    vi.stubEnv("GHL_API_TOKEN", "t");
    vi.stubEnv("GHL_LOCATION_ID", "loc");
    const llamadas: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        llamadas.push(`${init.method} ${url}`);
        const u = String(url);
        const json = u.includes("/contacts/search/duplicate")
          ? { contact: { id: "c1", contactName: "Ana", email: "ana@x.cl", tags: ["diagnostico"] } }
          : u.includes("/opportunities/pipelines")
            ? { pipelines: [{ id: "p1", name: "Diagnóstico", stages: [{ id: "s1", name: "Agendó" }] }] }
            : u.includes("/opportunities/search")
              ? { opportunities: [{ pipelineId: "p1", pipelineStageId: "s1", status: "open", monetaryValue: 230000 }] }
              : { conversations: [{ lastMessageType: "TYPE_WHATSAPP", lastMessageBody: "hola", lastMessageDate: 0 }] };
        return new Response(JSON.stringify(json), { status: 200 });
      })
    );

    const { datos } = await llamar("estado_en_ghl", { email: "ana@x.cl" });
    expect(datos.contacto.etiquetas).toEqual(["diagnostico"]);
    expect(datos.oportunidades[0]).toMatchObject({ pipeline: "Diagnóstico", etapa: "Agendó", valor_clp: 230000 });
    expect(datos.conversaciones[0].canal).toBe("TYPE_WHATSAPP");
    expect(llamadas.every((l) => l.startsWith("GET "))).toBe(true);
  });
});
