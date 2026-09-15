import type { Pregunta, PreguntaTag, Ruta } from "./tipos";

/**
 * Única fuente de verdad del cuestionario de Cris. Tributario.
 *
 * Transcrito del documento de insumos diligenciado por Cris (agosto 2026).
 * Si se ajustan preguntas o pesos, ajustar también los umbrales en
 * lib/scoring.ts, los tests, y subir VERSION_CUESTIONARIO: el score crudo
 * de escalas distintas no se puede promediar entre sí.
 */
export const VERSION_CUESTIONARIO = 1;

export const RUTAS: Ruta[] = ["A", "B", "C"];

/** Nombre visible de cada ruta. */
export const NOMBRE_RUTA: Record<Ruta, string> = {
  A: "Inversionista inicial",
  B: "Inversionista intermedio",
  C: "Inversionista consolidado",
};

export const PREGUNTA_BIFURCACION = {
  texto: "¿Cuántas propiedades tienes hoy?",
  ayuda:
    "Incluye las promesas de compraventa si vas a firmar la escritura este año.",
  opciones: [
    { ruta: "A" as Ruta, texto: "Hasta 5 propiedades" },
    { ruta: "B" as Ruta, texto: "Entre 6 y 15 propiedades" },
    { ruta: "C" as Ruta, texto: "16 propiedades o más" },
  ],
};

// ------------------------------------------------------------------
// Preguntas de clasificación: iguales en las tres rutas. Cada ruta usa
// sus propios ids para que el panel de abandonos distinga dónde se cae.
// ------------------------------------------------------------------

function preguntaProblema(id: string): PreguntaTag {
  return {
    id,
    tipo: "tag",
    campo: "problema_principal",
    texto:
      "Si tuvieras que señalar UNA sola cosa que hoy te tiene más frenado con tus propiedades, ¿cuál es?",
    opciones: [
      { id: "pago_de_mas", texto: "Estoy pagando más impuesto del que debería y no sé cómo bajarlo" },
      { id: "notificacion_sii", texto: "El SII me notificó, o temo que me notifique, por ingresos de arriendo" },
      { id: "comprar_mas", texto: "Quiero comprar más propiedades, pero me frena el impacto tributario" },
      { id: "sociedad", texto: "Necesito crear o ajustar una sociedad de inversiones" },
      { id: "herencia", texto: "Quiero proteger mi patrimonio pensando en el impuesto a la herencia" },
      { id: "otro", texto: "Otra cosa", requiereDetalle: true },
    ],
  };
}

function preguntaIntencion(id: string): PreguntaTag {
  return {
    id,
    tipo: "tag",
    campo: "nivel_intencion",
    texto: "¿Qué has hecho hasta ahora para resolver este tema?",
    opciones: [
      { id: "nada", texto: "Nada todavía, es la primera vez que lo pienso en serio" },
      { id: "contenido_gratis", texto: "He visto contenido gratuito en redes o he leído sobre el tema" },
      { id: "compro_producto", texto: "Ya compré un curso, ebook o programa sobre el tema" },
      { id: "contrato_servicio", texto: "Ya contraté a un contador, abogado o asesor para este tema" },
    ],
  };
}

function preguntaAbierta(id: string): Pregunta {
  return {
    id,
    tipo: "abierta",
    texto:
      "En tus propias palabras, ¿qué es lo que más te frena hoy para ordenar el tema tributario de tus propiedades?",
    ayuda: "Opcional. Puedes saltarla y ver tu resultado de inmediato.",
    placeholder: "Escribe lo que se te venga a la cabeza…",
    maxLargo: 500,
  };
}

/** Ruta A (hasta 5 propiedades): 7 puntuadas (score 7-21), 2 de etiqueta, 1 abierta. */
export const PREGUNTAS_A: Pregunta[] = [
  {
    id: "a1",
    tipo: "puntuada",
    texto: "¿Sabes exactamente bajo qué régimen tributario declaras el arriendo de tus propiedades?",
    opciones: [
      { id: "a1_1", texto: "No sé bien cómo se calcula, mi contador lo hace y no reviso", puntos: 1 },
      { id: "a1_2", texto: "Tengo una idea general, pero no reviso el detalle cada año", puntos: 2 },
      { id: "a1_3", texto: "Sí, lo reviso cada año y sé por qué pago lo que pago", puntos: 3 },
    ],
  },
  {
    id: "a2",
    tipo: "puntuada",
    texto:
      "Cuando declaras el arriendo, ¿restas los gastos que la ley te permite (intereses, contribuciones, gastos comunes, gastos básicos)?",
    opciones: [
      { id: "a2_1", texto: "No sabía que se podían restar", puntos: 1 },
      { id: "a2_2", texto: "Resto algunos, pero no estoy seguro de cuáles corresponden", puntos: 2 },
      { id: "a2_3", texto: "Sí, reviso cada gasto que la ley permite descontar", puntos: 3 },
    ],
  },
  {
    id: "a3",
    tipo: "puntuada",
    texto: "¿A nombre de quién están tus propiedades hoy?",
    opciones: [
      { id: "a3_1", texto: "Todas a mi nombre personal", puntos: 1 },
      { id: "a3_2", texto: "Algunas a mi nombre y otras en una sociedad, sin un criterio claro", puntos: 2 },
      { id: "a3_3", texto: "Tengo un criterio claro de qué va a mi nombre y qué a una sociedad", puntos: 3 },
    ],
  },
  {
    id: "a4",
    tipo: "puntuada",
    texto:
      "De tus propiedades arrendadas, ¿cuántas tienen su ingreso de arriendo declarado al 100%?",
    opciones: [
      { id: "a4_1", texto: "Ninguna, o solo una parte", puntos: 1 },
      { id: "a4_2", texto: "La mayoría, pero no todas", puntos: 2 },
      { id: "a4_3", texto: "Todas, al 100%", puntos: 3 },
    ],
  },
  {
    id: "a5",
    tipo: "puntuada",
    texto: "En los últimos 3 años, ¿has recibido alguna carta o notificación del SII por tus propiedades?",
    opciones: [
      { id: "a5_1", texto: "Sí, y no supe bien cómo responder", puntos: 1 },
      { id: "a5_2", texto: "Sí, pero la resolví con ayuda de mi contador", puntos: 2 },
      { id: "a5_3", texto: "No, y sé que estoy al día", puntos: 3 },
    ],
  },
  {
    id: "a6",
    tipo: "puntuada",
    texto: "Cuando piensas en comprar tu próxima propiedad, ¿consideras el efecto tributario antes de comprar?",
    opciones: [
      { id: "a6_1", texto: "No, decido primero y el tema tributario lo resuelvo después", puntos: 1 },
      { id: "a6_2", texto: "Lo pienso, pero no con cifras concretas", puntos: 2 },
      { id: "a6_3", texto: "Sí, simulo el efecto tributario antes de firmar", puntos: 3 },
    ],
  },
  {
    id: "a7",
    tipo: "puntuada",
    texto: "¿Sabes cómo afectaría el impuesto a la herencia a tus propiedades si algo te pasara hoy?",
    opciones: [
      { id: "a7_1", texto: "No lo he pensado", puntos: 1 },
      { id: "a7_2", texto: "Tengo una idea, pero no lo he revisado con nadie", puntos: 2 },
      { id: "a7_3", texto: "Sí, lo tengo evaluado", puntos: 3 },
    ],
  },
  preguntaProblema("a8"),
  preguntaIntencion("a9"),
  preguntaAbierta("a10"),
];

/** Ruta B (6 a 15 propiedades): 7 puntuadas (score 7-21), 2 de etiqueta, 1 abierta. */
export const PREGUNTAS_B: Pregunta[] = [
  {
    id: "b1",
    tipo: "puntuada",
    texto:
      "¿Tus propiedades de inversión están separadas de tus sociedades operativas (las que tienen riesgo comercial)?",
    opciones: [
      { id: "b1_1", texto: "No, todo está mezclado en las mismas sociedades", puntos: 1 },
      { id: "b1_2", texto: "Algunas sí, otras no", puntos: 2 },
      { id: "b1_3", texto: "Sí, completamente separadas", puntos: 3 },
    ],
  },
  {
    id: "b2",
    tipo: "puntuada",
    texto:
      "¿Qué tan al día estás con los beneficios tributarios que existen hoy para inversionistas inmobiliarios?",
    opciones: [
      { id: "b2_1", texto: "Sé que existen, pero no los tengo claros", puntos: 1 },
      { id: "b2_2", texto: "Conozco algunos y uso alguno", puntos: 2 },
      { id: "b2_3", texto: "Los tengo mapeados y los reviso cada año", puntos: 3 },
    ],
  },
  {
    id: "b3",
    tipo: "puntuada",
    texto:
      "¿Sabes cuántas utilidades acumuladas sin retirar tienen tus sociedades operativas, que podrían ayudarte en tu tributación inmobiliaria?",
    opciones: [
      { id: "b3_1", texto: "No tengo idea", puntos: 1 },
      { id: "b3_2", texto: "Tengo una idea aproximada", puntos: 2 },
      { id: "b3_3", texto: "Sí, lo reviso con mi contador cada año", puntos: 3 },
    ],
  },
  {
    id: "b4",
    tipo: "puntuada",
    texto:
      "Si una de tus sociedades operativas tuviera un problema legal grande, ¿tu patrimonio inmobiliario quedaría expuesto?",
    opciones: [
      { id: "b4_1", texto: "Sí, totalmente", puntos: 1 },
      { id: "b4_2", texto: "Parcialmente", puntos: 2 },
      { id: "b4_3", texto: "No, está protegido en otra estructura", puntos: 3 },
    ],
  },
  {
    id: "b5",
    tipo: "puntuada",
    texto:
      "¿Tienes definido qué pasaría con tus propiedades, y con el impuesto a la herencia, si tú faltaras?",
    opciones: [
      { id: "b5_1", texto: "No lo he trabajado", puntos: 1 },
      { id: "b5_2", texto: "Lo he pensado, pero no está formalizado", puntos: 2 },
      { id: "b5_3", texto: "Sí, está planificado y formalizado", puntos: 3 },
    ],
  },
  {
    id: "b6",
    tipo: "puntuada",
    texto:
      "Para financiar nuevas compras, ¿usas más de una fuente (bancos, leasing, aportes de terceros)?",
    opciones: [
      { id: "b6_1", texto: "Uso solo una fuente, sin comparar", puntos: 1 },
      { id: "b6_2", texto: "Uso dos, pero no las comparo a fondo", puntos: 2 },
      { id: "b6_3", texto: "Comparo varias alternativas antes de decidir", puntos: 3 },
    ],
  },
  {
    id: "b7",
    tipo: "puntuada",
    texto:
      "¿Cada cuánto revisas tu estructura patrimonial con un asesor tributario, más allá de tu contador?",
    opciones: [
      { id: "b7_1", texto: "Nunca lo he hecho", puntos: 1 },
      { id: "b7_2", texto: "Lo hice una vez, hace tiempo", puntos: 2 },
      { id: "b7_3", texto: "Lo reviso al menos una vez al año", puntos: 3 },
    ],
  },
  preguntaProblema("b8"),
  preguntaIntencion("b9"),
  preguntaAbierta("b10"),
];

/** Ruta C (16 propiedades o más): 8 puntuadas (score 8-24), 2 de etiqueta, 1 abierta. */
export const PREGUNTAS_C: Pregunta[] = [
  {
    id: "c1",
    tipo: "puntuada",
    texto:
      "¿Tu patrimonio inmobiliario está organizado bajo una estructura de holding (matriz y filiales) o cada activo va por su lado?",
    opciones: [
      { id: "c1_1", texto: "Cada propiedad o proyecto está suelto, sin una estructura común", puntos: 1 },
      { id: "c1_2", texto: "Hay algo de orden, pero no es un holding formal", puntos: 2 },
      { id: "c1_3", texto: "Sí, tengo una estructura de holding definida", puntos: 3 },
    ],
  },
  {
    id: "c2",
    tipo: "puntuada",
    texto:
      "Además de bienes raíces, ¿inviertes en otros instrumentos (acciones, fondos mutuos, bonos)?",
    opciones: [
      { id: "c2_1", texto: "No, todo está en bienes raíces", puntos: 1 },
      { id: "c2_2", texto: "Algo, pero sin una estrategia clara", puntos: 2 },
      { id: "c2_3", texto: "Sí, con una estrategia definida de diversificación", puntos: 3 },
    ],
  },
  {
    id: "c3",
    tipo: "puntuada",
    texto:
      "Cuando vendes acciones o fondos con ganancia, ¿sabes si esa ganancia queda exenta o afecta a impuesto?",
    opciones: [
      { id: "c3_1", texto: "No lo sé", puntos: 1 },
      { id: "c3_2", texto: "Tengo una idea general", puntos: 2 },
      { id: "c3_3", texto: "Lo sé con precisión y lo planifico antes de vender", puntos: 3 },
    ],
  },
  {
    id: "c4",
    tipo: "puntuada",
    texto:
      "Si tienes inversiones o cuentas en el extranjero, ¿tienes claro qué debes declarar ante el SII?",
    opciones: [
      { id: "c4_1", texto: "No tengo claro qué debo declarar de eso", puntos: 1 },
      { id: "c4_2", texto: "Declaro, pero no reviso si es exactamente correcto", puntos: 2 },
      { id: "c4_3", texto: "Sí, declaro correctamente y lo verifico cada año", puntos: 3 },
    ],
  },
  {
    id: "c5",
    tipo: "puntuada",
    texto:
      "¿Tu plan de sucesión patrimonial ya considera cómo se pagaría el impuesto a la herencia sin vender activos?",
    opciones: [
      { id: "c5_1", texto: "No lo he trabajado", puntos: 1 },
      { id: "c5_2", texto: "Está pensado, pero no formalizado", puntos: 2 },
      { id: "c5_3", texto: "Sí, está formalizado (seguros, sociedad, pacto, etc.)", puntos: 3 },
    ],
  },
  {
    id: "c6",
    tipo: "puntuada",
    texto:
      "¿Existe un protocolo o acuerdo familiar sobre cómo se administra el patrimonio si tú no estás?",
    opciones: [
      { id: "c6_1", texto: "No existe", puntos: 1 },
      { id: "c6_2", texto: "Se ha hablado, pero no está escrito", puntos: 2 },
      { id: "c6_3", texto: "Sí, existe y está escrito", puntos: 3 },
    ],
  },
  {
    id: "c7",
    tipo: "puntuada",
    texto:
      "¿Qué tan al día está tu asesor actual en normativa tributaria internacional (doble tributación, rentas pasivas, etc.)?",
    opciones: [
      { id: "c7_1", texto: "No tengo un asesor especializado en esto", puntos: 1 },
      { id: "c7_2", texto: "Tengo uno, pero rara vez toca estos temas", puntos: 2 },
      { id: "c7_3", texto: "Sí, lo revisamos activamente", puntos: 3 },
    ],
  },
  {
    id: "c8",
    tipo: "puntuada",
    texto:
      "¿Cada cuánto haces una revisión preventiva completa de tu estructura, antes de que el SII la mire primero?",
    ayuda: "Por ejemplo, frente a la Norma General Antielusiva.",
    opciones: [
      { id: "c8_1", texto: "Nunca", puntos: 1 },
      { id: "c8_2", texto: "La hice una vez", puntos: 2 },
      { id: "c8_3", texto: "La hago periódicamente (cada 1 o 2 años)", puntos: 3 },
    ],
  },
  preguntaProblema("c9"),
  preguntaIntencion("c10"),
  preguntaAbierta("c11"),
];

const PREGUNTAS: Record<Ruta, Pregunta[]> = {
  A: PREGUNTAS_A,
  B: PREGUNTAS_B,
  C: PREGUNTAS_C,
};

export function preguntasDeRuta(ruta: Ruta): Pregunta[] {
  return PREGUNTAS[ruta];
}

/** Pregunta abierta de cada ruta (la última). */
export const PREGUNTA_ABIERTA_ID: Record<Ruta, string> = {
  A: "a10",
  B: "b10",
  C: "c11",
};

/** Id de la pregunta que alimenta cada campo de etiqueta, por ruta. */
export const PREGUNTAS_TAG: Record<Ruta, { problema: string; intencion: string }> = {
  A: { problema: "a8", intencion: "a9" },
  B: { problema: "b8", intencion: "b9" },
  C: { problema: "c9", intencion: "c10" },
};

/** Etiquetas cortas para el panel interno y el CSV. */
export const TEXTO_PROBLEMA: Record<string, string> = {
  pago_de_mas: "Paga de más",
  notificacion_sii: "SII / notificación",
  comprar_mas: "Quiere comprar más",
  sociedad: "Sociedad de inversiones",
  herencia: "Herencia",
  otro: "Otra cosa",
};

export const TEXTO_INTENCION: Record<string, string> = {
  nada: "Nada todavía",
  contenido_gratis: "Contenido gratis",
  compro_producto: "Compró curso o ebook",
  contrato_servicio: "Contrató asesor",
};
