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
    titulo: "Tu diagnóstico está listo",
    subtitulo:
      "Déjanos tus datos para desbloquear tus 3 pasos concretos y proteger tu patrimonio.",
    labelNombre: "Tu nombre",
    labelEmail: "Tu correo",
    labelTelefono: "Tu WhatsApp",
    placeholderTelefono: "+56 9 1234 5678",
    ayudaTelefono: "Te confirmamos por aquí la hora de tu asesoría.",
    consentimiento:
      "Acepto recibir mi diagnóstico y correos de Cris. Tributario sobre tributación e inversión inmobiliaria. Puedo darme de baja cuando quiera.",
    boton: "Desbloquear mi diagnóstico completo",
    enviando: "Desbloqueando…",
    privacidad: "Tus datos están protegidos. Ver política de privacidad.",
  },

  resultado: {
    etiquetaFase: (nombreRuta: string, etapa: number) =>
      `${nombreRuta} · Etapa ${etapa} de 3`,
    tusPasos: "Tus 3 pasos concretos",
    guardado:
      "Te enviamos este diagnóstico a tu correo para que vuelvas a él cuando quieras.",
    ctaTitulo: "Tu siguiente paso",
    ctaBoton: "Quiero agendar mi asesoría",
    ctaNota:
      "Eliges el día y la hora que te acomoden. La reserva queda confirmada al instante.",
    ctaSinEnlace: "Escríbenos por Instagram",
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
