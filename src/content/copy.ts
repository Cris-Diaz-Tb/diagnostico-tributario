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
    titulo: "¿A dónde te enviamos tu diagnóstico?",
    subtitulo:
      "Déjanos tus datos y ves ahora mismo tu diagnóstico completo y tus 3 pasos. También te llegan al correo para que vuelvas a ellos.",
    pasosTitulo: "Tus 3 pasos concretos",
    pasoBloqueado: "Se desbloquea con tu correo",
    labelNombre: "Tu nombre",
    labelEmail: "Tu correo",
    labelTelefono: "Tu WhatsApp",
    placeholderTelefono: "+56 9 1234 5678",
    consentimiento:
      "Acepto recibir mi diagnóstico y correos de Cris. Tributario sobre tributación e inversión inmobiliaria. Puedo darme de baja cuando quiera.",
    boton: "Ver mi diagnóstico completo",
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

  /**
   * Landing larga (entrada /descubre) para tráfico frío de anuncios.
   * Estructura de quiz-funnel: gancho → las 3 etapas → los 3 errores en
   * voz de Cris → qué recibes → para quién → preguntas. Todo lleva a
   * /diagnostico. Pendiente de aprobación de Cris.
   */
  landingEtapas: {
    status: "placeholder" as "placeholder" | "aprobado",
    etiqueta: "Diagnóstico gratuito · 2 minutos",
    titulo:
      "Aunque tus propiedades rindan, podrías estar pagando más impuesto del que la ley exige",
    subtitulo:
      "Todo inversionista inmobiliario pasa por 3 etapas con sus impuestos. Descubre en cuál estás y qué hacer esta semana para pagar lo que corresponde, no más.",
    boton: "Descubrir mi etapa gratis",
    nota: "Sin registro previo · Tus respuestas son confidenciales",

    etapasTitulo: "Las 3 etapas de un patrimonio inmobiliario",
    etapasIntro:
      "Tu etapa no depende de cuántas propiedades tengas, sino de cómo están declaradas y estructuradas. Saber en cuál estás te dice qué hacer primero.",
    etapas: [
      {
        nombre: "Pagas a ciegas",
        texto:
          "Declaras tus arriendos como te dicen, sin tener claro bajo qué régimen ni qué gastos podrías restar. Cada propiedad nueva repite el problema.",
      },
      {
        nombre: "Ordenas, pero sin estructura",
        texto:
          "Ya declaras y usas algunos beneficios, pero tus propiedades están a tu nombre o mezcladas con tu negocio sin un criterio claro.",
      },
      {
        nombre: "Estructuras y proteges",
        texto:
          "Cada propiedad está donde conviene, piensas el impuesto antes de comprar y tienes un plan para lo que heredará tu familia.",
      },
    ],
    etapasCierre:
      "El diagnóstico te ubica en una de estas etapas según tu número de propiedades y tus respuestas.",

    autorSaludo: "Hola, soy Cris",
    autorIntro:
      "Llevo más de 14 años asesorando a inversionistas inmobiliarios en Chile. Creé este diagnóstico porque veo los mismos tres errores una y otra vez, en personas con 2 propiedades y en personas con 30.",
    errores: [
      {
        titulo: "Restar menos gastos de los que la ley permite",
        texto:
          "Intereses del crédito, contribuciones, gastos comunes: la mayoría deja al menos uno fuera, y ese impuesto pagado de más no se recupera solo.",
      },
      {
        titulo: "Tener todo a tu nombre, o todo mezclado con tu negocio",
        texto:
          "Sin un criterio claro, cada propiedad nueva suma impuesto y exposición en lugar de sumar patrimonio protegido.",
      },
      {
        titulo: "Comprar primero y pensar el impuesto después",
        texto:
          "El efecto tributario de una compra se decide antes de firmar, no en la declaración de renta del año siguiente.",
      },
    ],
    autorCierre:
      "No es falta de conocimiento: nadie te enseñó a mirar tus propiedades con ojo tributario, solo con ojo inmobiliario. El diagnóstico te muestra cuál de estos errores te está costando más.",
    botonMedio: "Quiero saber en qué etapa estoy",

    recibesTitulo: "Al terminar recibes tu diagnóstico escrito",
    recibes: [
      "Tu etapa, de 1 a 3, dentro de tu perfil de inversionista.",
      "Un diagnóstico de tu situación, en palabras simples.",
      "3 pasos concretos para aplicar esta semana, sin contratar nada.",
      "Una copia en tu correo para volver a ella cuando quieras.",
    ],
    ejemploEtiqueta: "Ejemplo de resultado",
    ejemploFase: "Inversionista inicial · Etapa 2 de 3",
    ejemploTitulo: "Vas ordenando, pero expones tu patrimonio",
    ejemploTexto:
      "Ya declaras tus arriendos y usas algunos beneficios, así que no partes de cero. El problema es que lo haces sin una estructura…",

    perfilesTitulo: "Las preguntas se adaptan a tu caso",
    perfilesIntro:
      "La primera pregunta es cuántas propiedades tienes. Desde ahí, el diagnóstico sigue el camino de tu perfil.",
    perfiles: [
      {
        rango: "1 a 4 propiedades",
        nombre: "Inversionista inicial",
        texto: "Cómo declaras tus arriendos y qué gastos podrías estar dejando fuera.",
      },
      {
        rango: "5 a 15 propiedades",
        nombre: "Inversionista intermedio",
        texto: "Cómo separar tus propiedades del riesgo de tu negocio y aprovechar beneficios.",
      },
      {
        rango: "16 o más",
        nombre: "Inversionista consolidado",
        texto: "Cómo mirar tu patrimonio como un todo, incluida la herencia.",
      },
    ],

    pasosTitulo: "Cómo funciona",
    pasos: [
      "Respondes unas 10 preguntas de opción múltiple. Toma 2 minutos.",
      "Ves tu etapa y el diagnóstico de tu situación.",
      "Dejas tu nombre, correo y WhatsApp y desbloqueas tus 3 pasos.",
    ],

    faqTitulo: "Preguntas frecuentes",
    faq: [
      {
        p: "¿Tiene algún costo?",
        r: "No. El diagnóstico es gratuito.",
      },
      {
        p: "¿Tengo que registrarme?",
        r: "No para empezar. Al final, para mostrarte tus 3 pasos y enviártelos, te pedimos tu nombre, correo y WhatsApp.",
      },
      {
        p: "¿Sirve si tengo una sola propiedad?",
        r: "Sí. Desde la primera propiedad arrendada conviene saber bajo qué régimen declaras y qué gastos puedes restar.",
      },
      {
        p: "¿Reemplaza a mi contador?",
        r: "No. Es orientativo y se basa solo en tus respuestas. Te sirve para saber qué revisar y qué preguntar, más allá de la declaración de cada año.",
      },
    ],

    cierreTitulo: "Descubre en qué etapa está tu patrimonio inmobiliario",
    cierreTexto: "Son 2 minutos y sales con 3 pasos concretos para esta semana.",
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
