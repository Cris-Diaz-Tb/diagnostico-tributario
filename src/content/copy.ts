import type { Ruta } from "./tipos";

/**
 * Copy de toda la plataforma. Textos de Cris (bloques 9 y 10 del documento
 * de insumos) con correcciones de estilo. Cambiar aquí, sin tocar código.
 */

export const COPY = {
  status: "aprobado" as "placeholder" | "aprobado",

  marca: {
    nombre: "Cris. Tributario",
    instagram: "@cris.tributario",
    instagramUrl: "https://www.instagram.com/cris.tributario/",
    firma: "Asesor Tributario de Reorganización e Inversiones Patrimoniales",
  },

  landing: {
    titulo: "¿Cuánto impuesto estás pagando de más por tus propiedades?",
    subtitulo:
      "Responde unas pocas preguntas y descubre en 2 minutos en qué etapa está tu patrimonio inmobiliario, y qué hacer esta semana para pagar menos y proteger lo que construiste.",
    bullets: [
      "Tu diagnóstico personalizado según tu número de propiedades y tu situación real ante el SII.",
      "3 pasos concretos que puedes aplicar esta semana, sin contratar nada todavía.",
      "Basado en más de 14 años asesorando a inversionistas inmobiliarios en Chile.",
    ],
    botonEmpezar: "Quiero mi diagnóstico gratis",
    notaTiempo: "Sin registro previo · Tus respuestas son confidenciales",
    pruebaSocial: "+130.000 personas siguen a Cris. Tributario en Instagram.",
  },

  quiz: {
    progresoDe: (actual: number, total: number) =>
      `Pregunta ${actual} de ${total}`,
    atras: "Atrás",
    botonSiguiente: "Siguiente",
    botonVerResultado: "Ver mi resultado",
    botonContinuar: "Continuar",
    botonSaltar: "Prefiero saltar esta pregunta",
    placeholderOtro: "Cuéntanos en una línea qué te tiene frenado…",
    ayudaOtro: "Escríbelo con tus palabras para poder seguir.",
    introAnalisis: "Un momento. Estamos revisando tu caso con calma.",
    // Pantalla de análisis entre el quiz y el resultado.
    analisis: {
      A: [
        "Leyendo tus respuestas",
        "Revisando cómo declaras tus arriendos",
        "Identificando dónde puedes estar pagando de más",
        "Armando tus 3 pasos concretos",
      ],
      B: [
        "Leyendo tus respuestas",
        "Revisando cómo está separado tu patrimonio",
        "Identificando beneficios sin capitalizar",
        "Armando tus 3 pasos concretos",
      ],
      C: [
        "Leyendo tus respuestas",
        "Revisando tu estructura patrimonial completa",
        "Identificando riesgos normativos",
        "Armando tus 3 pasos concretos",
      ],
    } satisfies Record<Ruta, string[]>,
  },

  gate: {
    titulo: "¿A dónde te enviamos tus 3 pasos?",
    subtitulo:
      "El primero ya es tuyo. Déjanos tu correo y ves los otros dos ahora mismo; también te llegan al correo para que vuelvas a ellos.",
    pasosTitulo: "Tus 3 pasos concretos",
    pasoLibre: "Puedes empezar hoy",
    pasoBloqueado: "Se desbloquea con tu correo",
    labelNombre: "Tu nombre",
    labelEmail: "Tu correo",
    labelTelefono: "Tu WhatsApp",
    placeholderTelefono: "+56 9 1234 5678",
    consentimiento:
      "Acepto recibir mi diagnóstico y correos de Cris. Tributario sobre tributación e inversión inmobiliaria. Puedo darme de baja cuando quiera.",
    boton: "Ver mis 3 pasos ahora",
    enviando: "Preparando tus pasos…",
    privacidad: "Tus datos están protegidos. Ver política de privacidad.",
  },

  resultado: {
    etiquetaFase: (nombreRuta: string, etapa: number) =>
      `${nombreRuta} · Etapa ${etapa} de 3`,
    tusPasos: "Tus 3 pasos concretos",
    guardado:
      "Te enviamos este diagnóstico a tu correo para que vuelvas a él cuando quieras.",
    ctaTitulo: "Tu siguiente paso",
    /** Solo con la Asesoría de Arquitectura (oferta asesoria_patrimonial). */
    ctaEntregable: "Te llevas tu Plano Tributario por escrito, con las acciones en orden.",
    ctaRespaldo:
      "Sesión 1:1 con Cris, arquitecto tributario con 14 años en tributación inmobiliaria.",
    ctaBoton: "Quiero agendar mi asesoría",
    ctaNota:
      "Eliges el día y la hora que te acomoden. Tu reserva queda confirmada al completar el pago.",
    ctaSinEnlace: "Escríbenos por Instagram",
  },

  webinar: {
    boton: "Todavía no. Quiero ir a la clase en vivo del 5 de noviembre",
  },

  /**
   * Lanzamiento (entrada /lanzamiento). Mismo diagnóstico; cambian la
   * portada y el siguiente paso del resultado, que invita al webinar.
   */
  lanzamiento: {
    titulo: "Llega al webinar sabiendo exactamente dónde estás parado",
    subtitulo:
      "Antes de la clase, responde unas pocas preguntas y descubre en 2 minutos en qué etapa está tu patrimonio inmobiliario. Así vas a saber qué parte del webinar aplica a tu caso.",
    bullets: [
      "Tu diagnóstico personalizado según tu número de propiedades y tu situación real ante el SII.",
      "3 pasos concretos que puedes aplicar esta semana, sin contratar nada.",
      "Tu punto de partida para sacarle el máximo provecho al webinar.",
    ],
    botonEmpezar: "Quiero mi diagnóstico antes del webinar",
    ctaTitulo: "Tu siguiente paso: el webinar",
    ctaTexto:
      "Lleva este diagnóstico a la clase. Con tu etapa a la vista vas a saber qué parte aplica a tu caso y qué hacer primero.",
    ctaBoton: "Ir al webinar",
    ctaSinEnlace:
      "Te enviaremos el enlace del webinar a tu correo y a tu WhatsApp.",
  },

  whatsapp: {
    boton: "Prefiero consultar por WhatsApp",
    nota: "Te respondemos con tu diagnóstico a la vista.",
    /** Mensaje prellenado. El bot de GHL lee la etapa y el código. */
    mensaje: (nombreRuta: string, etapa: number, fase: string, codigo: string) =>
      `Hola Cris, hice el diagnóstico tributario. Mi resultado fue ${nombreRuta}, etapa ${etapa} de 3 (${fase}), y mi código es ${codigo}. Quiero hacer una consulta.`,
  },

  avisoLegal:
    "Este diagnóstico es orientativo y se basa solo en tus respuestas. No constituye asesoría tributaria ni reemplaza la revisión de tu caso por un profesional.",

  email: {
    asunto: () => "Tu diagnóstico tributario inmobiliario ya está listo",
    intro:
      "Gracias por hacer el diagnóstico. Aquí tienes tu resultado completo con tus 3 pasos concretos. Guárdalo y, sobre todo, ejecútalo.",
    linkTexto: "Ver mi diagnóstico online",
    despedida:
      "Cris. Tributario\nAsesor Tributario de Reorganización e Inversiones Patrimoniales",
  },

  errores: {
    generico: "Algo salió mal. Intenta de nuevo en unos segundos.",
    consentimientoRequerido: "Necesitas aceptar para recibir tu diagnóstico.",
    telefonoInvalido: "Revisa tu WhatsApp, parece que le faltan dígitos.",
    /** El servidor rechazó los datos y no sabemos cuál campo fue. */
    datosInvalidos: "Revisa tus datos, hay algo que no cuadra.",
    resultadoNoEncontrado: "No encontramos este resultado.",
    resultadoNoEncontradoDetalle:
      "El enlace puede estar incompleto o el diagnóstico ya no existe. Puedes hacer el diagnóstico de nuevo en unos minutos.",
    volverAlInicio: "Hacer mi diagnóstico",
  },

  demo: {
    aviso:
      "Modo demo: la base de datos no está conectada, este diagnóstico no se guardará.",
  },

  placeholderBadge: "Texto provisional, pendiente de aprobación",
} as const;
