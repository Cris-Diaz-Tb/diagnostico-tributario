/**
 * Espacios de datos del diagnóstico. Cada diagnóstico guarda su origen
 * (columna `origen`) según la URL por la que entró, y el panel muestra un
 * espacio a la vez: los datos de un lanzamiento no se mezclan con los del
 * diagnóstico directo.
 *
 * El origen lo fija la página de entrada, nunca la fecha ni lo guardado en
 * el navegador: quien llegó por el grupo y después hace clic en un anuncio
 * no termina en el espacio equivocado.
 *
 * Un lanzamiento nuevo: agregar su entrada aquí y una ruta que renderice
 * <Quiz origen="..."/>. No necesita migración.
 */

export interface Origen {
  /** Nombre que se ve en el selector del panel. */
  nombre: string;
  /** Fechas del lanzamiento (informativas; la página no se cierra sola). */
  desde?: string;
  hasta?: string;
  /** Etiqueta extra en GHL para encontrar a estos contactos. */
  etiquetaGhl?: string;
  /**
   * Lanzamiento: el resultado invita al webinar en vez de agendar, y en
   * GHL no se crea la oportunidad del pipeline del diagnóstico directo.
   */
  esLanzamiento?: boolean;
}

export const ORIGEN_DIRECTO = "directo";
export const ORIGEN_LANZAMIENTO_OCT26 = "lanzamiento-2026-10";

export const ORIGENES = {
  [ORIGEN_DIRECTO]: { nombre: "Diagnóstico directo" },
  [ORIGEN_LANZAMIENTO_OCT26]: {
    nombre: "Lanzamiento oct 2026",
    desde: "2026-10-15",
    hasta: "2026-11-05",
    etiquetaGhl: "lanzamiento-oct26",
    esLanzamiento: true,
  },
} as const satisfies Record<string, Origen>;

export type OrigenId = keyof typeof ORIGENES;

export const IDS_ORIGEN = Object.keys(ORIGENES) as OrigenId[];

export function esOrigen(valor: unknown): valor is OrigenId {
  return typeof valor === "string" && Object.hasOwn(ORIGENES, valor);
}

/** Origen validado; cualquier valor desconocido cae al directo. */
export function origenValido(valor: unknown): OrigenId {
  return esOrigen(valor) ? valor : ORIGEN_DIRECTO;
}

export function datosDeOrigen(valor: unknown): Origen {
  return ORIGENES[origenValido(valor)];
}
