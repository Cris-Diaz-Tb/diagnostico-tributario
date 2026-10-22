import "server-only";
import { z } from "zod";
import { leerGhl, locationIdGhl } from "@/lib/crm";
import { herramienta, pct } from "./comun";
import { buscarDiagnosticos } from "./datos";

/**
 * Lo que pasa después del diagnóstico, leído de GoHighLevel: etiquetas,
 * oportunidad del pipeline y última conversación. Solo GET (y la búsqueda
 * de contactos, que en GHL es un POST pero no escribe nada).
 */

type Json = Record<string, unknown>;
const txt = (v: unknown) => (typeof v === "string" && v ? v : null);

const SIN_GHL = {
  error: "GoHighLevel no está configurado (GHL_API_TOKEN / GHL_LOCATION_ID) o no respondió.",
};

interface Pipeline {
  id: string;
  nombre: string;
  etapas: Map<string, string>;
}

async function pipelines(locationId: string): Promise<Map<string, Pipeline>> {
  const r = await leerGhl(`/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`);
  const lista = (r?.pipelines as Json[] | undefined) ?? [];
  return new Map(
    lista.map((p) => [
      String(p.id),
      {
        id: String(p.id),
        nombre: String(p.name ?? p.id),
        etapas: new Map(((p.stages as Json[] | undefined) ?? []).map((s) => [String(s.id), String(s.name ?? s.id)])),
      },
    ])
  );
}

async function buscarContacto(locationId: string, email: string | null, telefono: string | null) {
  const loc = encodeURIComponent(locationId);
  // Endpoint de duplicados: busca exacto por email o por número.
  for (const [param, valor] of [
    ["email", email],
    ["number", telefono],
  ] as const) {
    if (!valor) continue;
    const r = await leerGhl(`/contacts/search/duplicate?locationId=${loc}&${param}=${encodeURIComponent(valor)}`);
    const contacto = r?.contact as Json | undefined;
    if (contacto?.id) return contacto;
  }
  // Respaldo: búsqueda de texto.
  const query = email ?? telefono;
  if (!query) return null;
  const r = await leerGhl("/contacts/search", {
    metodo: "POST",
    cuerpo: { locationId, query, pageLimit: 1 },
  });
  return ((r?.contacts as Json[] | undefined) ?? [])[0] ?? null;
}

function oportunidad(o: Json, mapa: Map<string, Pipeline>) {
  const p = mapa.get(String(o.pipelineId));
  return {
    nombre: txt(o.name),
    pipeline: p?.nombre ?? txt(o.pipelineId),
    etapa: p?.etapas.get(String(o.pipelineStageId)) ?? txt(o.pipelineStageId),
    estado: txt(o.status),
    valor_clp: typeof o.monetaryValue === "number" ? o.monetaryValue : null,
    creada: txt(o.createdAt),
    actualizada: txt(o.updatedAt),
    ultimo_cambio_de_etapa: txt(o.lastStageChangeAt),
  };
}

export const HERRAMIENTAS_GHL = [
  herramienta({
    nombre: "estado_en_ghl",
    titulo: "Qué pasó después (GoHighLevel)",
    descripcion:
      "Para una persona del diagnóstico: su contacto en GoHighLevel (etiquetas, fuente, fecha), sus oportunidades con pipeline y etapa (si agendó, si ganó o perdió) y su última conversación (WhatsApp, etc.). Buscar por código, email o teléfono.",
    esquema: z
      .object({
        codigo: z.string().regex(/^[0-9A-Za-z-]{4,12}$/).optional(),
        email: z.string().max(200).optional(),
        telefono: z.string().max(30).optional(),
      })
      .refine((a) => a.codigo || a.email || a.telefono, "Indica codigo, email o telefono."),
    ejecutar: async (a) => {
      const locationId = locationIdGhl();
      if (!locationId) return SIN_GHL;

      // Con el código se sacan el email y el teléfono del diagnóstico.
      let email = a.email ?? null;
      let telefono = a.telefono ?? null;
      let codigo = a.codigo?.toUpperCase() ?? null;
      if (a.codigo || !email || !telefono) {
        const { filas } = await buscarDiagnosticos(
          { codigo: a.codigo, email: a.email, telefono: a.telefono, incluirPruebas: true },
          { limite: 1 }
        );
        const f = filas[0];
        if (f) {
          email ??= f.email ?? null;
          telefono ??= f.telefono ?? null;
          codigo ??= f.id.slice(0, 8).toUpperCase();
        }
      }
      if (!email && !telefono) {
        return { encontrado: false, mensaje: "El diagnóstico no tiene email ni teléfono (no dejó sus datos)." };
      }

      const contacto = await buscarContacto(locationId, email, telefono);
      if (!contacto) {
        return { encontrado: false, codigo, mensaje: "No hay contacto en GoHighLevel con ese email o teléfono." };
      }
      const contactId = String(contacto.id);
      const loc = encodeURIComponent(locationId);

      const [mapa, opps, convs] = await Promise.all([
        pipelines(locationId),
        leerGhl(`/opportunities/search?location_id=${loc}&contact_id=${encodeURIComponent(contactId)}&limit=20`),
        leerGhl(`/conversations/search?locationId=${loc}&contactId=${encodeURIComponent(contactId)}&limit=5`),
      ]);

      const conversaciones = (convs?.conversations as Json[] | undefined) ?? [];
      return {
        encontrado: true,
        codigo,
        contacto: {
          id: contactId,
          nombre: txt(contacto.contactName) ?? ([contacto.firstName, contacto.lastName].filter(Boolean).join(" ") || null),
          email: txt(contacto.email),
          telefono: txt(contacto.phone),
          etiquetas: (contacto.tags as string[] | undefined) ?? [],
          fuente: txt(contacto.source),
          creado: txt(contacto.dateAdded),
        },
        oportunidades: ((opps?.opportunities as Json[] | undefined) ?? []).map((o) => oportunidad(o, mapa)),
        conversaciones: convs
          ? conversaciones.map((c) => ({
              canal: txt(c.lastMessageType) ?? txt(c.type),
              ultimo_mensaje:
                typeof c.lastMessageBody === "string" ? c.lastMessageBody.slice(0, 300) : null,
              direccion: txt(c.lastMessageDirection),
              fecha:
                typeof c.lastMessageDate === "number"
                  ? new Date(c.lastMessageDate).toISOString()
                  : txt(c.lastMessageDate),
              no_leidos: typeof c.unreadCount === "number" ? c.unreadCount : null,
            }))
          : "No se pudieron leer (el token de GHL puede no tener permiso de conversaciones).",
      };
    },
  }),

  herramienta({
    nombre: "resumen_pipeline",
    titulo: "Pipeline del diagnóstico (GoHighLevel)",
    descripcion:
      "Cuántas oportunidades hay en cada etapa del pipeline del diagnóstico en GoHighLevel y cuántas están abiertas, ganadas o perdidas, con el valor total. Cierra el embudo: de completado a venta. Los leads de lanzamientos no entran a este pipeline.",
    esquema: z.object({
      pipeline_id: z.string().max(100).optional().describe("Vacío = GHL_PIPELINE_DIAGNOSTICO."),
    }),
    ejecutar: async (a) => {
      const locationId = locationIdGhl();
      if (!locationId) return SIN_GHL;
      const pipelineId = a.pipeline_id ?? process.env.GHL_PIPELINE_DIAGNOSTICO?.trim();
      if (!pipelineId) return { error: "No hay GHL_PIPELINE_DIAGNOSTICO configurado; pasa pipeline_id." };

      const mapa = await pipelines(locationId);
      const p = mapa.get(pipelineId);
      const todas: Json[] = [];
      // Hasta 1.000 oportunidades (10 páginas de 100).
      for (let pagina = 1; pagina <= 10; pagina++) {
        const r = await leerGhl(
          `/opportunities/search?location_id=${encodeURIComponent(locationId)}&pipeline_id=${encodeURIComponent(pipelineId)}&limit=100&page=${pagina}`
        );
        if (!r) {
          if (pagina === 1) return SIN_GHL;
          break;
        }
        const lote = (r.opportunities as Json[] | undefined) ?? [];
        todas.push(...lote);
        if (lote.length < 100) break;
      }

      const porEtapa = new Map<string, Json[]>();
      for (const o of todas) {
        const etapa = p?.etapas.get(String(o.pipelineStageId)) ?? String(o.pipelineStageId);
        porEtapa.set(etapa, [...(porEtapa.get(etapa) ?? []), o]);
      }
      // En el orden del pipeline.
      const orden = p ? [...p.etapas.values()] : [...porEtapa.keys()];
      const valor = (os: Json[]) =>
        os.reduce((s, o) => s + (typeof o.monetaryValue === "number" ? o.monetaryValue : 0), 0);
      const porEstado = (estado: string) => todas.filter((o) => o.status === estado);

      return {
        pipeline: p?.nombre ?? pipelineId,
        total: todas.length,
        ...(todas.length >= 1000 ? { aviso: "Se leyeron las primeras 1.000 oportunidades." } : {}),
        por_estado: Object.fromEntries(
          ["open", "won", "lost", "abandoned"].map((e) => [
            e,
            { n: porEstado(e).length, pct: pct(porEstado(e).length, todas.length), valor_clp: valor(porEstado(e)) },
          ])
        ),
        por_etapa: orden
          .filter((e) => porEtapa.has(e) || p)
          .map((e) => ({ etapa: e, n: porEtapa.get(e)?.length ?? 0, valor_clp: valor(porEtapa.get(e) ?? []) })),
      };
    },
  }),
];
