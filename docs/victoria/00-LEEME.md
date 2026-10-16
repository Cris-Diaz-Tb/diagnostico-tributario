# Victoria: entrenamiento actualizado con el diagnóstico

Victoria ya atiende el WhatsApp de Cris y GHL no permite un segundo bot en el mismo número. Por eso, en lugar de crear un bot nuevo, se le enseña a Victoria a reconocer y atender a quien viene del diagnóstico. Su ruta no cambia: califica, presenta la Asesoría Patrimonial y Tributaria, cobra con Mercado Pago, pide el comprobante y recién ahí agenda.

## Archivos

| Archivo | Dónde va en GHL | Qué cambió |
|---|---|---|
| `01-personalidad-y-reglas.md` | Personalidad / instrucciones de Victoria. Reemplaza el texto actual completo. | Sección nueva "Leads que vienen del diagnóstico" y una línea en el paso 1. El resto es el texto vigente. |
| `02-kb-resultados-del-diagnostico.md` | Base de conocimiento de Victoria, como documento nuevo. | Nuevo. Los 9 resultados, cómo leer el mensaje de WhatsApp y preguntas frecuentes. |
| `03-kb-asesoria-patrimonial-y-tributaria.md` | Base de conocimiento de Victoria. Reemplaza el PDF de onboarding (v1.2). | El contenido del PDF, actualizado y limpio para el bot. Detalle abajo. |

GHL suele aceptar en la base de conocimiento archivos PDF, DOCX o TXT, o texto pegado. Si no acepta `.md`, pega el contenido o guárdalo como `.txt`.

## Qué cambió del PDF de onboarding al documento 03

**Actualizado con lo que ya definen las reglas vigentes** (en el PDF figuraba como pendiente o con otro valor):
- Entregables: sesión, dos informes (situación actual y esquema de planificación) y transcripción completa.
- Horario: lunes a viernes de 09:00 a 19:00, hora de Chile.
- Checklist de preparación: confirmado y se envía al confirmar la cita.
- Segmentación: tabla de las reglas vigentes (0–3, 4–9 con más de $5.000.000, 9+, 15+), incluida la pregunta extra con 3 propiedades.
- Respuesta sobre implementación: la que usan las reglas.

**Agregado.**
- El diagnóstico como fuente de leads, con referencia al documento 02.

**Quitado, porque es interno y Victoria no debe usarlo ni repetirlo.**
- Riesgos abiertos, métricas de la auditoría, encuesta del webinar y metas.
- Las notas "Por qué importa" de cada pregunta.
- Tareas pendientes del equipo ("Lo que falta para encender el agente").
- Correcciones de pauta y creativos.

**Decisiones mías sobre puntos que el PDF dejó abiertos.** Las tomé por el lado conservador; Cris debe confirmarlas:
- **Reagendamiento (5.7):** se reagenda; si pide reagendar más de una vez, se escala.
- **Boleta o factura (9.3):** Victoria dice a nombre de quién se emite; si preguntan el tipo de documento o si sirve como gasto, escala.
- **Política de privacidad (9.2):** como no existe, Victoria no promete nada; si la piden, escala.
- **Testimonios nuevos (6.2):** no hay. Victoria usa solo el caso de $20M → $18M y el ángulo de legado.

## Límite de palabras

`01-personalidad-y-reglas.md` tiene 1.885 palabras (1.984 si se cuentan guiones y flechas sueltos). Está bajo el límite de 2.000.

Para hacer espacio a la sección nueva se quitaron cuatro frases que estaban repetidas, sin perder ninguna regla:

- "Toda respuesta termina en pregunta…" al inicio de Objeciones. Sigue en Identidad y tono.
- "6+ propiedades o estructura societaria → escala a Cris" en Señales de intención. Sigue en Escalado a humano.
- "Ofrecer o bloquear horario antes de validar el pago" en Prohibiciones. Sigue como "Regla dura" en el paso 8.
- "Mezclar esta asesoría con…" en Prohibiciones. Sigue como "Regla de marca" en El servicio.

La objeción "¿Los $230.000 cubren la ejecución?" se unió con la respuesta sobre implementación, que decía lo mismo.

## Decisiones tomadas

- **El lead del diagnóstico sigue el flujo normal de pago (Mercado Pago y comprobante).** No se le envía el enlace de agenda del diagnóstico (`Diag URL agenda`). Ese enlace solo lo usa el botón "Quiero agendar mi asesoría" de la web.
- **Victoria no menciona el puntaje ni los servicios internos del diagnóstico.** El diagnóstico recomienda internamente 4 servicios, uno a $360.000; Victoria ofrece solo la Asesoría Patrimonial y Tributaria.
- **La fase se lee del mensaje.** No depende de que GHL entregue los campos del contacto al bot. El mensaje de WhatsApp ya trae la fase (A1 a C3) y la base de conocimiento explica cada una.

## Pendiente antes de publicar

1. **Reemplazar el PDF en la base de conocimiento.** Quita el PDF de onboarding de la base de Victoria y sube los documentos 02 y 03. Si quedan los dos, el PDF le da datos viejos (entregables "pendientes", segmentación distinta) y métricas internas que no debe repetir.
2. **Contradicciones de segmentación entre el onboarding (v1.2) y las reglas vigentes.** Las reglas vigentes mandan y no se tocaron, pero conviene que Cris las cierre:
   - Perfil apto: el onboarding dice 5 a 9 propiedades y más de $3.000.000 al año en impuestos; las reglas dicen 4 a 9 y más de $5.000.000.
   - Derivación a Reorganización: el onboarding dice 10 o más; las reglas dicen 15 o más.
   - Escalado: las reglas escalan con 6 o más propiedades, pero consideran apto el rango de 4 a 9. Un lead con 7 propiedades cae en ambos.
   - Las rutas del diagnóstico usan otros cortes (hasta 5, de 6 a 15, 16 o más). Por eso Victoria siempre pregunta el número exacto.
3. **Workflow "Webhook Diagnóstico".** Conviene agregar la condición "Diag Codigo no está vacío" antes de la etiqueta `bot-diagnostico`. Con Victoria atendiendo a todos, esa etiqueta sirve como marca para reportes, no para encender un bot.
4. **Workflows de pago de Encuadrado.** No se activan para los leads que cierran por WhatsApp, porque Victoria cobra con Mercado Pago. Siguen sirviendo para quien agenda desde el botón de la web.

## Cómo probar

Envía desde un WhatsApp de prueba el mensaje del botón del diagnóstico, con una fase real (por ejemplo A2). Victoria debe:

1. Saludar por el nombre sin el saludo genérico.
2. Explicar el resultado "Vas ordenando, pero expones tu patrimonio" en 2 o 3 frases.
3. Preguntar el número exacto de propiedades y la estructura de tenencia, sin pedir el código.
4. No dar el precio antes de calificar y no mencionar el puntaje.

Repite con una fase C (debe derivar a Reorganización y escalar a Cris) y con un mensaje sin fase (debe pedir el código o el correo).
