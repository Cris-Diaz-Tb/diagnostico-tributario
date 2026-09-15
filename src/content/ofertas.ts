import type { FaseId, OfertaId, Roadmap, TagProblema } from "./tipos";
import { ROADMAPS } from "./roadmaps";

/**
 * Catálogo de servicios de Cris (bloque 8.1 del documento de insumos).
 *
 * El precio es INTERNO: se usa en el panel, el CSV y el CRM para que el
 * equipo comercial sepa qué ofrecer. Nunca se muestra en el diagnóstico,
 * la página de resultado ni el correo (regla de marca, hay test).
 */
export interface Oferta {
  id: OfertaId;
  nombre: string;
  paraQuien: string;
  precioInternoClp: number;
}

export const OFERTAS: Record<OfertaId, Oferta> = {
  asesoria_patrimonial: {
    id: "asesoria_patrimonial",
    nombre: "Asesoría tributaria patrimonial (diagnóstico y reorganización)",
    paraQuien: "Inversionistas con 1 a 15 propiedades que quieren pagar menos impuesto y ordenar su estructura",
    precioInternoClp: 230000,
  },
  sociedad_inversiones: {
    id: "sociedad_inversiones",
    nombre: "Asesoría de constitución y estructuración de sociedad de inversiones",
    paraQuien: "Quienes necesitan separar su patrimonio inmobiliario del riesgo operativo y planificar herencia",
    precioInternoClp: 230000,
  },
  regularizacion_sii: {
    id: "regularizacion_sii",
    nombre: "Asesoría de regularización ante el SII",
    paraQuien: "Quienes fueron notificados, o temen serlo, por ingresos de arriendo no declarados",
    precioInternoClp: 230000,
  },
  patrimonial_internacional: {
    id: "patrimonial_internacional",
    nombre: "Asesoría patrimonial internacional y diversificación",
    paraQuien: "Inversionistas consolidados con inversión en otros instrumentos o en el extranjero",
    precioInternoClp: 360000,
  },
};

/**
 * Regla transversal del bloque 8.2: quien marca una notificación del SII
 * recibe siempre la regularización, sin importar su fase.
 */
const OFERTA_PRIORITARIA: Partial<Record<TagProblema, OfertaId>> = {
  notificacion_sii: "regularizacion_sii",
};

export function ofertaDeRoadmap(roadmap: Roadmap, tag: string | null): Oferta {
  const clave = tag as TagProblema | null;
  const id =
    (clave && OFERTA_PRIORITARIA[clave]) ??
    (clave && roadmap.ofertaPorTag?.[clave]) ??
    roadmap.oferta;
  return OFERTAS[id];
}

export function ofertaRecomendada(fase: FaseId, tag: string | null): Oferta {
  return ofertaDeRoadmap(ROADMAPS[fase], tag);
}
