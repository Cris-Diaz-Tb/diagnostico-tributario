/**
 * Rutas del diagnóstico, separadas por número de propiedades:
 * A = hasta 5 · B = entre 6 y 15 · C = 16 o más.
 */
export type Ruta = "A" | "B" | "C";

export type FaseId =
  | "A1" | "A2" | "A3"
  | "B1" | "B2" | "B3"
  | "C1" | "C2" | "C3";

export interface OpcionPuntuada {
  id: string;
  texto: string;
  puntos: 1 | 2 | 3;
}

export interface OpcionTag {
  id: string;
  texto: string;
  /**
   * Al elegirla se despliega un campo de texto obligatorio en la misma
   * pantalla (caso "Otra cosa"). El detalle se guarda aparte del tag.
   */
  requiereDetalle?: boolean;
}

export interface PreguntaPuntuada {
  id: string;
  tipo: "puntuada";
  texto: string;
  /** Aclaración opcional bajo el enunciado. */
  ayuda?: string;
  opciones: OpcionPuntuada[];
}

/** Campo de la base donde aterriza la respuesta de una pregunta no puntuada. */
export type CampoTag = "problema_principal" | "nivel_intencion";

export interface PreguntaTag {
  id: string;
  tipo: "tag";
  texto: string;
  campo: CampoTag;
  opciones: OpcionTag[];
}

/**
 * Pregunta de investigación: texto libre, siempre opcional y siempre la
 * última de su ruta. No puntúa y no puede bloquear el avance al resultado.
 */
export interface PreguntaAbierta {
  id: string;
  tipo: "abierta";
  texto: string;
  ayuda: string;
  placeholder: string;
  maxLargo: number;
}

export type Pregunta = PreguntaPuntuada | PreguntaTag | PreguntaAbierta;

/** Problema principal que marca la persona (bloque 5.1 del documento de insumos). */
export type TagProblema =
  | "pago_de_mas"
  | "notificacion_sii"
  | "comprar_mas"
  | "sociedad"
  | "herencia"
  | "otro";

/** Qué ha hecho ya la persona para resolver su tema tributario. */
export type NivelIntencion =
  | "nada"
  | "contenido_gratis"
  | "compro_producto"
  | "contrato_servicio";

/** Servicios del catálogo de Cris (bloque 8.1). */
export type OfertaId =
  | "asesoria_patrimonial"
  | "sociedad_inversiones"
  | "regularizacion_sii"
  | "patrimonial_internacional";

export interface Roadmap {
  fase: FaseId;
  /** Visible antes de capturar el email: valida el diagnóstico y genera curiosidad. */
  parteA: {
    titulo: string;
    diagnostico: string;
  };
  /** Gateada: se desbloquea al dejar el email. */
  parteB: {
    pasos: [string, string, string];
    cta: string;
    /** CTA alternativo según el problema principal marcado. */
    ctaPorTag?: Partial<Record<TagProblema, string>>;
  };
  /** Servicio que se recomienda por defecto en esta fase. */
  oferta: OfertaId;
  /** Servicio alternativo según el problema principal (bloque 8.2). */
  ofertaPorTag?: Partial<Record<TagProblema, OfertaId>>;
  status: "placeholder" | "aprobado";
}
