import type { FaseId, Roadmap, TagProblema } from "./tipos";

/**
 * Los 9 resultados del diagnóstico (3 rutas por 3 fases).
 *
 * Textos de Cris, transcritos del documento de insumos con correcciones
 * de ortografía y de trato (tú). Reglas que ningún texto puede romper:
 * - Nunca prometer resultados garantizados ni "cero riesgo" ante el SII.
 * - Nunca insinuar evasión, ni "no pagar impuestos".
 * - Nunca revelar precios dentro del diagnóstico.
 * - Nunca nombrar ni atacar a colegas o competidores.
 * Hay tests que fallan si se cuela alguna de estas cosas.
 */

/** Bloque 8.2: el SII es prioritario sobre cualquier otra oferta, en todas las fases. */
const CTA_SII =
  "Si el SII ya te notificó, o temes que lo haga, lo primero es regularizar antes de optimizar. En una asesoría de regularización revisamos tu caso, qué corresponde declarar o rectificar y cómo responder con respaldo documentado.";

const CTA_HERENCIA =
  "En una asesoría con foco en herencia revisamos cómo planificar el impuesto a la herencia de tus propiedades sin obligar a nadie a vender, y qué estructura conviene a tu patrimonio actual.";

const CTA_SOCIEDAD =
  "En una asesoría de constitución y estructuración definimos si te conviene crear o ajustar una sociedad de inversiones, qué mover a ella y en qué orden, antes de tu próxima compra.";

/** Todas las fases comparten la prioridad del SII. */
function conPrioridadSii(
  ctaPorTag: Partial<Record<TagProblema, string>> = {}
): Partial<Record<TagProblema, string>> {
  return { ...ctaPorTag, notificacion_sii: CTA_SII };
}

export const ROADMAPS: Record<FaseId, Roadmap> = {
  // ================================================================
  // RUTA A · Inversionista inicial (hasta 5 propiedades) · score 7-21
  // ================================================================
  A1: {
    fase: "A1",
    status: "aprobado",
    parteA: {
      titulo: "Patrimonio a la deriva",
      diagnostico:
        "Hoy pagas impuesto sobre tus arriendos casi a ciegas: no tienes claro el régimen bajo el que declaras, ni qué gastos podrías estar restando legalmente. No es que te falte comprensión, es que nadie te enseñó a mirar tus propiedades con ojo tributario, solo con ojo inmobiliario. Si sigues así, vas a seguir pagando más impuesto del que la ley te exige, y cada propiedad nueva que compres va a repetir el mismo problema, ahora multiplicado.",
    },
    parteB: {
      pasos: [
        "Junta los comprobantes de arriendo de los últimos 12 meses de cada propiedad y anota cuánto declaraste por cada una. Sin esto no puedes saber si estás pagando de más: es el punto de partida real.",
        "Con esa lista, identifica los gastos que pagaste este año por cada propiedad (contribuciones, seguros, intereses del crédito, comisión de Airbnb si arriendas por renta corta) y súmalos. La mayoría de las personas en tu situación deja de restar al menos uno de estos, y eso es impuesto pagado de más que no se recupera solo.",
        "Escribe, junto a cada propiedad, si está a tu nombre personal o en una sociedad, y por qué. Tener este mapa, aunque hoy no cambies nada, es lo que te va a permitir decidir con criterio dónde estructurar tu patrimonio la próxima vez que compres.",
      ],
      cta: "Con este mapa en la mano, en una asesoría revisamos si tu régimen actual es el correcto y cuánto impuesto podrías dejar de pagar usando solo lo que la ley ya te permite.",
      ctaPorTag: conPrioridadSii(),
    },
    oferta: "asesoria_patrimonial",
  },
  A2: {
    fase: "A2",
    status: "aprobado",
    parteA: {
      titulo: "Vas ordenando, pero expones tu patrimonio",
      diagnostico:
        "Ya declaras tus arriendos y usas algunos beneficios, así que no partes de cero. El problema es que lo haces sin una estructura: parte de tus propiedades está a tu nombre personal sin un criterio claro de por qué, y eso te deja pagando más impuesto del necesario y expuesto si algo pasa con alguna de ellas. No es un problema de conocimiento, ya sabes bastante: es un problema de orden.",
    },
    parteB: {
      pasos: [
        "Haz una lista de tus propiedades separada en dos columnas: las que están a tu nombre personal y las que están en sociedad. Es el mapa que necesitas antes de decidir nada; sin él, cualquier cambio es a ciegas.",
        "Para cada propiedad a tu nombre personal, escribe si genera arriendo o es donde vives. Esto te va a mostrar cuáles son candidatas reales a moverse a una estructura societaria: no todas necesitan moverse.",
        "Revisa tu última declaración de renta y anota qué gastos restaste por cada propiedad. Compáralo con la lista completa de gastos que la ley permite deducir. Si te falta alguno, ya sabes dónde está tu primer ahorro.",
      ],
      cta: "Con este orden hecho, en una asesoría revisamos si conviene mover alguna propiedad a una sociedad de inversiones y cuánto impuesto real te ahorraría hacerlo, antes de que compres la próxima.",
      ctaPorTag: conPrioridadSii(),
    },
    oferta: "asesoria_patrimonial",
  },
  A3: {
    fase: "A3",
    status: "aprobado",
    parteA: {
      titulo: "Listo para estructurar y escalar",
      diagnostico:
        "Tienes el control de lo básico: declaras bien, usas los gastos que corresponden y piensas el efecto tributario antes de comprar. El techo que tienes ahora no es de conocimiento, es de estructura: sigues comprando y arrendando a título personal, y eso significa que cada propiedad nueva suma más impuesto y más exposición, en lugar de sumar patrimonio protegido.",
    },
    parteB: {
      pasos: [
        "Antes de tu próxima compra, simula, aunque sea a mano y con números redondos, cuánto impuesto pagarías arrendando esa propiedad a tu nombre personal versus a través de una sociedad. La diferencia te muestra si vale la pena estructurar ahora o esperar.",
        "Revisa si ya tienes o no una sociedad de inversiones vigente. Si no la tienes, anota qué necesitarías para constituirla. Esto se resuelve en una asesoría, pero el diagnóstico previo lo puedes hacer tú.",
        "Escribe cómo te gustaría que quedara repartido tu patrimonio entre tus hijos o herederos hoy mismo, sin pensar todavía en impuestos. Esa es la base sobre la que después se planifica el impuesto a la herencia.",
      ],
      cta: "En una asesoría revisamos tu caso puntual: si conviene constituir o activar una sociedad de inversiones para tus próximas compras, y cómo empezar a planificar el impuesto a la herencia sin vender nada.",
      ctaPorTag: conPrioridadSii({
        sociedad: CTA_SOCIEDAD,
        herencia: CTA_HERENCIA,
      }),
    },
    oferta: "sociedad_inversiones",
    ofertaPorTag: { herencia: "asesoria_patrimonial" },
  },

  // ================================================================
  // RUTA B · Inversionista intermedio (6 a 15 propiedades) · score 7-21
  // ================================================================
  B1: {
    fase: "B1",
    status: "aprobado",
    parteA: {
      titulo: "Patrimonio operativo y expuesto",
      diagnostico:
        "Tu patrimonio inmobiliario hoy vive mezclado con tus sociedades operativas, las que tienen riesgo comercial real. Eso significa que un problema legal o comercial en cualquiera de esas empresas puede terminar afectando propiedades que nada tienen que ver con ese riesgo. No es falta de visión de tu parte: cuando esas sociedades se crearon, probablemente el objetivo era operar, no proteger patrimonio. El costo de no separarlo ahora es que cada año hay más patrimonio expuesto al mismo riesgo.",
    },
    parteB: {
      pasos: [
        "Lista todas tus sociedades y anota, al lado de cada una, si tiene actividad comercial con terceros (proveedores, clientes, trabajadores) o si solo tiene bienes. Esto separa lo operativo de lo patrimonial en tu propio papel.",
        "Para cada sociedad con actividad comercial, anota qué propiedades de inversión están a su nombre. Esas son, hoy, las que están expuestas al riesgo del negocio.",
        "Revisa si tienes utilidades acumuladas sin retirar en esas sociedades; tu contador te puede dar ese número en un día. Ese monto es relevante para decidir después cómo se hace el traspaso a una estructura patrimonial separada.",
      ],
      cta: "En una asesoría evaluamos cómo separar tu patrimonio inmobiliario del riesgo operativo de tus empresas, y qué implicancia tributaria tiene hacerlo con lo que ya tienes acumulado.",
      ctaPorTag: conPrioridadSii(),
    },
    oferta: "asesoria_patrimonial",
  },
  B2: {
    fase: "B2",
    status: "aprobado",
    parteA: {
      titulo: "Beneficios que no estás capitalizando",
      diagnostico:
        "Ya conoces los beneficios tributarios que existen para inversionistas como tú, y probablemente usas alguno. El problema es que no has dado el paso de reorganizar tu patrimonio en una estructura que los capture por completo: sabes que existen, pero no se reflejan en lo que pagas. Mientras no reorganices, sigues pagando como si no los conocieras.",
    },
    parteB: {
      pasos: [
        "Anota, uno por uno, los beneficios tributarios que sabes que existen para tu situación, aunque sea de memoria. Esta lista te va a servir para ver cuáles ya usas y cuáles no.",
        "Al lado de cada uno, escribe si hoy lo usas activamente o solo lo conoces. La brecha entre ambas columnas es impuesto que estás dejando de ahorrar.",
        "Pide a tu contador, o revisa tú, el detalle de utilidades retenidas de tus sociedades con propiedades. Ese número es clave para saber qué tan grande es la oportunidad de reorganizar ahora versus esperar.",
      ],
      cta: "En una asesoría convertimos esa lista en un plan de reorganización patrimonial concreto (qué mover, a qué estructura y en qué orden) para que los beneficios que ya conoces empiecen a bajar tu carga tributaria real.",
      ctaPorTag: conPrioridadSii({ sociedad: CTA_SOCIEDAD }),
    },
    oferta: "asesoria_patrimonial",
    ofertaPorTag: { sociedad: "sociedad_inversiones" },
  },
  B3: {
    fase: "B3",
    status: "aprobado",
    parteA: {
      titulo: "A un paso de blindar tu patrimonio",
      diagnostico:
        "Vas adelante: separas, al menos en parte, tu patrimonio del riesgo operativo y usas beneficios tributarios de forma activa. Lo que queda pendiente es cerrar el círculo con la planificación del impuesto a la herencia, porque hoy, si algo te pasara, tus herederos tendrían que resolver ese impuesto con lo que tengan a mano, probablemente vendiendo propiedades a mal precio y con apuro.",
    },
    parteB: {
      pasos: [
        "Escribe cuánto valen todas tus propiedades de inversión sumadas, a precio de mercado aunque sea aproximado. Ese número es la base sobre la que se calcula el impuesto a la herencia.",
        "Con ese total, revisa los tramos de la Ley de Impuesto a las Herencias, Asignaciones y Donaciones (Ley 16.271) y ubica en qué tramo caería tu patrimonio hoy. No necesitas el monto exacto, solo una magnitud real.",
        "Conversa con tu cónyuge o tus herederos directos sobre cómo les gustaría que se resolviera ese impuesto (vendiendo algo, con un seguro, con liquidez separada) antes de que sea una decisión de urgencia.",
      ],
      cta: "En una asesoría diseñamos el plan de sucesión patrimonial completo: cómo se cubre el impuesto a la herencia sin obligar a vender, y qué estructura societaria termina de blindar lo que ya empezaste a proteger.",
      ctaPorTag: conPrioridadSii(),
    },
    oferta: "asesoria_patrimonial",
  },

  // ================================================================
  // RUTA C · Inversionista consolidado (16 o más) · score 8-24
  // ================================================================
  C1: {
    fase: "C1",
    status: "aprobado",
    parteA: {
      titulo: "Diversificado, pero sin blindaje integral",
      diagnostico:
        "Ya diversificaste más allá de los bienes raíces, con otros instrumentos y quizás algo en el extranjero, pero tu patrimonio no está bajo una estructura que lo mire como un todo. Cada activo se administra por su lado, y eso hace que decisiones tributarias importantes, como una venta de acciones o una inversión en el extranjero, se tomen sin ver el efecto conjunto en tu carga tributaria total ni en tu plan de sucesión.",
    },
    parteB: {
      pasos: [
        "Haz un inventario simple de todo tu patrimonio: inmobiliario, acciones, fondos, inversión en el extranjero. Solo el listado, sin valorizar todavía. Es el primer paso que casi nadie con patrimonio diversificado se toma el tiempo de hacer por escrito.",
        "Frente a cada activo, anota si sabes con certeza cómo tributa cuando lo vendes o cuando genera renta (exento, con crédito, con retención). Donde escribas «no estoy seguro», ahí está tu mayor riesgo de sorpresa tributaria.",
        "Revisa si tus inversiones o cuentas en el extranjero están incluidas en tu declaración de renta o en las declaraciones juradas correspondientes, y confirma con tu asesor actual si están al día.",
      ],
      cta: "En una asesoría revisamos tu patrimonio como un todo, no activo por activo, y diseñamos una estructura de holding que optimice la carga tributaria conjunta y prepare el terreno para tu planificación de herencia.",
      ctaPorTag: conPrioridadSii(),
    },
    oferta: "patrimonial_internacional",
  },
  C2: {
    fase: "C2",
    status: "aprobado",
    parteA: {
      titulo: "Estructura sólida, falta afinar el detalle",
      diagnostico:
        "Tienes una estructura patrimonial que funciona: holding, diversificación y algo de planificación de herencia. El riesgo en tu nivel ya no es de estructura general, es de detalle técnico: normativa internacional, actualización constante y gobernanza familiar formalizada. A tu nivel de patrimonio, un detalle mal resuelto pesa mucho más que en una etapa inicial.",
    },
    parteB: {
      pasos: [
        "Lista todas tus inversiones fuera de Chile (cuentas, sociedades, activos) y confirma, para cada una, si tu asesor actual la revisó específicamente en el último año: no en general, sino esa inversión en particular.",
        "Revisa si existe un protocolo familiar escrito sobre la administración del patrimonio si tú faltas. Si no existe, anota quién debería estar en esa conversación y agenda una fecha real para tenerla.",
        "Pregunta a tu asesor actual, o revisa tú, si tu estructura ya considera las reglas sobre rentas pasivas y exceso de endeudamiento en el extranjero. Si nunca has escuchado esos términos aplicados a tu caso, ahí hay una revisión pendiente.",
      ],
      cta: "En una asesoría hacemos una revisión preventiva de tu estructura, con foco en normativa internacional y gobernanza familiar, antes de que sea el SII u otra autoridad quien la revise primero.",
      ctaPorTag: conPrioridadSii(),
    },
    oferta: "patrimonial_internacional",
  },
  C3: {
    fase: "C3",
    status: "aprobado",
    parteA: {
      titulo: "Patrimonio consolidado y protegido",
      diagnostico:
        "Tu patrimonio está en un punto sólido: estructura, diversificación, planificación de herencia y seguimiento normativo activo. A este nivel, el trabajo deja de ser corregir y pasa a ser mantener: revisar cada cambio normativo, nacional e internacional, contra tu estructura específica, antes de que ese cambio te afecte.",
    },
    parteB: {
      pasos: [
        "Define por escrito con qué frecuencia vas a revisar tu estructura completa (sugerido: al menos una vez al año) y quién es responsable de avisarte cuando cambie una norma que te afecte directamente.",
        "Revisa si tu protocolo familiar o pacto de socios está actualizado con la composición actual de tu patrimonio, no con la de hace unos años. El patrimonio cambia más rápido que los documentos que lo regulan.",
        "Identifica un cambio normativo reciente, nacional o internacional, que podría afectar a alguno de tus activos y confirma con tu asesor si ya se hizo el ajuste correspondiente.",
      ],
      cta: "En una asesoría hacemos el seguimiento normativo activo de tu estructura completa, nacional e internacional, y ajustamos lo que la norma vaya cambiando, para que tu patrimonio siga protegido sin que tengas que revisar la ley tú mismo.",
      ctaPorTag: conPrioridadSii({
        otro: "Si lo que te frena es otra cosa, cuéntanos tu caso en una conversación breve y vemos juntos si tiene sentido un seguimiento normativo de tu estructura.",
      }),
    },
    oferta: "patrimonial_internacional",
  },
};

export function roadmapDeFase(fase: FaseId): Roadmap {
  return ROADMAPS[fase];
}

/** CTA a mostrar: el específico del problema principal si existe, si no el de la fase. */
export function ctaEfectivo(roadmap: Roadmap, tag: string | null): string {
  const especifico = tag ? roadmap.parteB.ctaPorTag?.[tag as TagProblema] : undefined;
  return especifico ?? roadmap.parteB.cta;
}

/** Número de etapa dentro de la ruta (A2 → 2). */
export function etapaDeFase(fase: FaseId): number {
  return Number(fase[1]);
}

/** Todas las fases, en orden de ruta y etapa. */
export const FASES = Object.keys(ROADMAPS) as FaseId[];
