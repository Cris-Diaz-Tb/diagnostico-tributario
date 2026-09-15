import { preguntasDeRuta, PREGUNTAS_TAG } from "@/content/preguntas";
import type { FaseId, Pregunta, Ruta } from "@/content/tipos";

/** Respuestas de opción: { preguntaId: opcionId } */
export type Respuestas = Record<string, string>;

/**
 * Textos libres: { preguntaId: texto }. Cubre dos casos — la pregunta
 * abierta de investigación y el detalle obligatorio de "Otra cosa".
 */
export type TextosLibres = Record<string, string>;

export interface RespuestaDetallada {
  preguntaId: string;
  pregunta: string;
  opcionId: string;
  opcion: string;
  puntos: number | null; // null en preguntas tag y abiertas
}

export interface ResultadoScoring {
  ruta: Ruta;
  score: number;
  fase: FaseId;
  /** Problema principal marcado por la persona. */
  tag: string | null;
  /** Texto libre cuando el problema principal es "otro". */
  problemaOtro: string | null;
  nivelIntencion: string | null;
  textoAbierto: string | null;
  detalle: RespuestaDetallada[];
}

/**
 * Umbrales por tercios (bloque 6 del documento de insumos).
 * Ruta A y B: 7 preguntas puntuadas, rango 7-21 → 7-11 · 12-16 · 17-21.
 * Ruta C: 8 preguntas puntuadas, rango 8-24 → 8-13 · 14-19 · 20-24.
 * Recalibrar con datos reales si la fase alta resulta muy fácil de alcanzar.
 */
const UMBRALES: Record<Ruta, Array<{ hasta: number; fase: FaseId }>> = {
  A: [
    { hasta: 11, fase: "A1" },
    { hasta: 16, fase: "A2" },
    { hasta: 21, fase: "A3" },
  ],
  B: [
    { hasta: 11, fase: "B1" },
    { hasta: 16, fase: "B2" },
    { hasta: 21, fase: "B3" },
  ],
  C: [
    { hasta: 13, fase: "C1" },
    { hasta: 19, fase: "C2" },
    { hasta: 24, fase: "C3" },
  ],
};

export class RespuestasInvalidasError extends Error {}

/** Recorta y normaliza un texto libre; devuelve null si queda vacío. */
function limpiarTexto(valor: string | undefined, maxLargo: number): string | null {
  const limpio = (valor ?? "").trim();
  return limpio ? limpio.slice(0, maxLargo) : null;
}

function buscarOpcion(pregunta: Pregunta, opcionId: string) {
  if (pregunta.tipo === "abierta") return undefined;
  return pregunta.opciones.find((o) => o.id === opcionId);
}

/**
 * Valida respuestas contra el catálogo y calcula score, fase y etiquetas.
 * Lanza RespuestasInvalidasError si falta una pregunta obligatoria, si una
 * opción no existe, o si se eligió "Otra cosa" sin escribir el detalle.
 *
 * La pregunta abierta es opcional por diseño: nunca debe impedir que
 * alguien llegue a su resultado.
 */
export function calcularResultado(
  ruta: Ruta,
  respuestas: Respuestas,
  textos: TextosLibres = {}
): ResultadoScoring {
  const preguntas = preguntasDeRuta(ruta);
  const detalle: RespuestaDetallada[] = [];
  let score = 0;
  let tag: string | null = null;
  let problemaOtro: string | null = null;
  let nivelIntencion: string | null = null;
  let textoAbierto: string | null = null;

  const idsTag = PREGUNTAS_TAG[ruta];

  for (const pregunta of preguntas) {
    if (pregunta.tipo === "abierta") {
      textoAbierto = limpiarTexto(textos[pregunta.id], pregunta.maxLargo);
      if (textoAbierto) {
        detalle.push({
          preguntaId: pregunta.id,
          pregunta: pregunta.texto,
          opcionId: "texto_libre",
          opcion: textoAbierto,
          puntos: null,
        });
      }
      continue;
    }

    const opcionId = respuestas[pregunta.id];
    if (!opcionId) {
      throw new RespuestasInvalidasError(`Falta respuesta para ${pregunta.id}`);
    }

    const opcion = buscarOpcion(pregunta, opcionId);
    if (!opcion) {
      throw new RespuestasInvalidasError(
        `Opción inválida "${opcionId}" para ${pregunta.id}`
      );
    }

    if (pregunta.tipo === "puntuada") {
      score += (opcion as { puntos: number }).puntos;
      detalle.push({
        preguntaId: pregunta.id,
        pregunta: pregunta.texto,
        opcionId: opcion.id,
        opcion: opcion.texto,
        puntos: (opcion as { puntos: number }).puntos,
      });
      continue;
    }

    // Pregunta de etiqueta
    if (pregunta.id === idsTag.problema) {
      tag = opcion.id;
      if ((opcion as { requiereDetalle?: boolean }).requiereDetalle) {
        problemaOtro = limpiarTexto(textos[pregunta.id], 300);
        if (!problemaOtro) {
          throw new RespuestasInvalidasError(
            `"${opcion.id}" requiere detalle en ${pregunta.id}`
          );
        }
      }
    } else if (pregunta.id === idsTag.intencion) {
      nivelIntencion = opcion.id;
    }

    detalle.push({
      preguntaId: pregunta.id,
      pregunta: pregunta.texto,
      opcionId: opcion.id,
      opcion: problemaOtro
        ? `${opcion.texto}: ${problemaOtro}`
        : opcion.texto,
      puntos: null,
    });
  }

  return {
    ruta,
    score,
    fase: faseDeScore(ruta, score),
    tag,
    problemaOtro,
    nivelIntencion,
    textoAbierto,
    detalle,
  };
}

export function faseDeScore(ruta: Ruta, score: number): FaseId {
  for (const umbral of UMBRALES[ruta]) {
    if (score <= umbral.hasta) return umbral.fase;
  }
  // Score por encima del rango teórico: cae en la fase más alta.
  return UMBRALES[ruta][UMBRALES[ruta].length - 1].fase;
}

export interface ResultadoParcial {
  ruta: Ruta;
  detalle: RespuestaDetallada[];
  /** Suma de lo respondido hasta ahora (no es el score final). */
  scoreParcial: number;
  preguntasRespondidas: number;
  totalPreguntas: number;
  tag: string | null;
}

/**
 * Versión tolerante de `calcularResultado` para diagnósticos a medias:
 * ignora lo que falta en vez de lanzar. La usan el guardado progresivo
 * y el panel de abandonos.
 *
 * Descarta silenciosamente ids de pregunta u opción que no existan en el
 * catálogo — así un payload manipulado no puede meter basura en la base.
 */
export function detallarParcial(
  ruta: Ruta,
  respuestas: Respuestas,
  textos: TextosLibres = {}
): ResultadoParcial {
  const preguntas = preguntasDeRuta(ruta);
  const detalle: RespuestaDetallada[] = [];
  let scoreParcial = 0;
  let tag: string | null = null;

  const idsTag = PREGUNTAS_TAG[ruta];

  for (const pregunta of preguntas) {
    if (pregunta.tipo === "abierta") {
      const texto = limpiarTexto(textos[pregunta.id], pregunta.maxLargo);
      if (texto) {
        detalle.push({
          preguntaId: pregunta.id,
          pregunta: pregunta.texto,
          opcionId: "texto_libre",
          opcion: texto,
          puntos: null,
        });
      }
      continue;
    }

    const opcionId = respuestas[pregunta.id];
    if (!opcionId) continue;

    const opcion = buscarOpcion(pregunta, opcionId);
    if (!opcion) continue;

    if (pregunta.tipo === "puntuada") {
      const puntos = (opcion as { puntos: number }).puntos;
      scoreParcial += puntos;
      detalle.push({
        preguntaId: pregunta.id,
        pregunta: pregunta.texto,
        opcionId: opcion.id,
        opcion: opcion.texto,
        puntos,
      });
      continue;
    }

    if (pregunta.id === idsTag.problema) tag = opcion.id;
    const detalleOtro = (opcion as { requiereDetalle?: boolean }).requiereDetalle
      ? limpiarTexto(textos[pregunta.id], 300)
      : null;

    detalle.push({
      preguntaId: pregunta.id,
      pregunta: pregunta.texto,
      opcionId: opcion.id,
      opcion: detalleOtro ? `${opcion.texto}: ${detalleOtro}` : opcion.texto,
      puntos: null,
    });
  }

  return {
    ruta,
    detalle,
    scoreParcial,
    preguntasRespondidas: detalle.length,
    totalPreguntas: preguntas.length,
    tag,
  };
}

/**
 * Igual que `faseEstimada`, pero partiendo del detalle ya guardado en la
 * base (que es como lo lee el panel de abandonos).
 */
export function faseEstimadaDeDetalle(
  ruta: Ruta,
  detalle: RespuestaDetallada[]
): FaseId | null {
  return faseEstimada({
    ruta,
    detalle,
    scoreParcial: detalle.reduce((s, d) => s + (d.puntos ?? 0), 0),
    preguntasRespondidas: detalle.length,
    totalPreguntas: preguntasDeRuta(ruta).length,
    tag: null,
  });
}

/**
 * Fase probable de alguien que abandonó a mitad: proyecta el promedio de
 * lo que sí respondió sobre las preguntas que faltaban.
 *
 * Es una estimación, no un diagnóstico — sirve para saber si quien
 * abandona es perfil de etapa 1 o de etapa 3, que es una decisión de contenido distinta.
 * Devuelve null si respondió muy poco como para proyectar nada.
 */
export function faseEstimada(parcial: ResultadoParcial): FaseId | null {
  const puntuadas = parcial.detalle.filter((d) => d.puntos !== null);
  if (puntuadas.length < 2) return null;

  const totalPuntuadas = preguntasDeRuta(parcial.ruta).filter(
    (p) => p.tipo === "puntuada"
  ).length;

  const promedio = parcial.scoreParcial / puntuadas.length;
  return faseDeScore(parcial.ruta, Math.round(promedio * totalPuntuadas));
}
