import "server-only";
import { definicionesHerramientas, ejecutarHerramienta } from "./herramientas";

/**
 * Servidor MCP mínimo sobre Streamable HTTP, sin sesiones: cada POST trae
 * un mensaje JSON-RPC y se responde con JSON. Solo herramientas (tools),
 * todas de lectura.
 */

export const VERSIONES_PROTOCOLO = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCCIONES = `Datos del diagnóstico tributario de Cris para inversionistas inmobiliarios en Chile. Solo lectura.
Hay dos espacios que no se mezclan: el diagnóstico directo ("directo", lo que traen los anuncios) y cada lanzamiento (ej. "lanzamiento-2026-10", el grupo antes del webinar).
Etapas: iniciado → vio el gate con su fase (DiagnosticoIncompleto) → completado: dejó sus datos (DiagnosticoCompletado). En los datos, la etapa "capturado" es el completado y "abandono_gate" el que vio el gate y se fue.
Empieza por listar_espacios o resumen_embudo; usa listar_diagnosticos con detalle=true para leer respuestas y textos libres, y ver_diagnostico para una persona.
Para análisis: cruzar (cualquier variable contra otra, también respuesta:<id de pregunta>, o filas=dia para la serie diaria) y comparar_periodos (dos rangos de fechas, o lanzamiento contra directo).
Para interpretar y proponer cambios: ver_cuestionario (preguntas, opciones y puntos), ver_roadmaps (qué ve cada fase antes y después del gate), ver_ofertas y ver_textos_del_sitio.
Para lo que pasa después del diagnóstico: estado_en_ghl (una persona en GoHighLevel: etiquetas, etapa del pipeline, conversación) y resumen_pipeline.
Cita el código del diagnóstico al dar ejemplos. Los datos de contacto son personales: no los repitas salvo que te los pidan.`;

interface MensajeRpc {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

type RespuestaRpc =
  | { jsonrpc: "2.0"; id: string | number | null; result: unknown }
  | { jsonrpc: "2.0"; id: string | number | null; error: { code: number; message: string } };

const error = (id: MensajeRpc["id"], code: number, message: string): RespuestaRpc => ({
  jsonrpc: "2.0",
  id: id ?? null,
  error: { code, message },
});

/** Responde un mensaje. null = notificación (no lleva respuesta). */
export async function manejarMensaje(msg: MensajeRpc): Promise<RespuestaRpc | null> {
  if (!msg || typeof msg !== "object" || typeof msg.method !== "string") {
    return error(msg?.id, -32600, "Solicitud inválida");
  }
  const esNotificacion = msg.id === undefined;
  if (esNotificacion) return null;
  const id = msg.id ?? null;

  switch (msg.method) {
    case "initialize": {
      const pedida = String(msg.params?.protocolVersion ?? "");
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: VERSIONES_PROTOCOLO.includes(pedida) ? pedida : VERSIONES_PROTOCOLO[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "diagnostico-cris", title: "Diagnóstico Cris. Tributario", version: "1.0.0" },
          instructions: INSTRUCCIONES,
        },
      };
    }
    case "ping":
      return { jsonrpc: "2.0", id, result: {} };
    case "tools/list":
      return { jsonrpc: "2.0", id, result: { tools: definicionesHerramientas() } };
    case "tools/call": {
      const nombre = msg.params?.name;
      if (typeof nombre !== "string") return error(id, -32602, "Falta el nombre de la herramienta");
      const r = await ejecutarHerramienta(nombre, msg.params?.arguments);
      if (!r.ok) {
        return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: r.error }], isError: true } };
      }
      return {
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: JSON.stringify(r.resultado) }] },
      };
    }
    // Sin recursos ni prompts: listas vacías para clientes que las piden igual.
    case "resources/list":
      return { jsonrpc: "2.0", id, result: { resources: [] } };
    case "prompts/list":
      return { jsonrpc: "2.0", id, result: { prompts: [] } };
    default:
      return error(id, -32601, `Método no soportado: ${msg.method}`);
  }
}
