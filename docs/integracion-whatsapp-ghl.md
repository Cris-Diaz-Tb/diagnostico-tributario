# Consulta por WhatsApp con el bot de GoHighLevel

Guía para dejar funcionando el segundo canal del diagnóstico: la persona termina,
toca "Prefiero consultar por WhatsApp", escribe con su etapa y su código, y un bot
de GHL conversa con su diagnóstico a la vista hasta enviarle el enlace para pagar y
agendar en Encuadrado.

## Cómo funciona

```
Resultado → botón WhatsApp → wa.me/56951744388 con "…etapa 2 de 3 (A2), y mi código es 3F9A1C2B…"
  → WAGHL → conversación en GHL (el contacto ya existe: el WhatsApp es obligatorio en el diagnóstico)
  → Workflow 1: webhook a /api/ghl/vincular → escribe en ESE contacto el contexto del diagnóstico
  → Bot (Conversation AI) lee {{contact.diag_contexto}} → conversa → envía {{contact.diag_url_agenda}}
  → Encuadrado → etiquetas "pago iniciado / abandonado / confirmado encuadrado"
  → Workflows 2-4: pausan, recuperan o cierran
```

Qué hace la app sola, sin configurar nada en GHL:

- Al dejar el email, crea o actualiza el contacto con etiquetas `diag-*` y los
  campos "Diag …".
- Crea una oportunidad en el pipeline del diagnóstico, en la etapa
  `GHL_ETAPA_COMPLETADO`, por $230.000.
- El endpoint `/api/ghl/vincular` mueve esa oportunidad a `GHL_ETAPA_WHATSAPP` y
  agrega la etiqueta `diag-whatsapp`.

## 1. Campos personalizados (ya creados)

**Contacto.** Los lee el bot.

| Campo | Clave para el bot |
|---|---|
| Diag Codigo | `{{contact.diag_codigo}}` |
| Diag Etapa | `{{contact.diag_etapa}}` |
| Diag Fase | `{{contact.diag_fase}}` |
| Diag Score | `{{contact.diag_score}}` |
| Diag Problema principal | `{{contact.diag_problema_principal}}` |
| Diag Oferta recomendada | `{{contact.diag_oferta_recomendada}}` |
| Diag URL resultado | `{{contact.diag_url_resultado}}` |
| Diag URL agenda | `{{contact.diag_url_agenda}}` |
| Diag Contexto | `{{contact.diag_contexto}}` |

**Oportunidad.** Es lo que se ve en la ficha de la oportunidad:

- Código del diagnóstico
- Etapa del diagnóstico
- Puntaje del diagnóstico
- Problema principal
- Qué ha hecho hasta ahora
- Servicio recomendado
- Ver resultado del diagnóstico
- Resumen del diagnóstico

**Pendiente en la interfaz de GHL:**

1. Configuración → Campos personalizados → Oportunidades → crear la carpeta
   **"Diagnóstico"** y mover ahí los 8 campos de la oportunidad. Así aparece en el
   menú lateral, igual que "Asesoría" y "Cursos".
2. Lo mismo en Contactos con los 9 campos "Diag …". Es opcional.

## 2. Pipeline

La app usa **FUNNEL DE DIAGNOSTICO LEADS**. Renombrar sus etapas no rompe nada,
porque la app guarda los ids, no los nombres.

| Etapa actual | Renombrar a | Quién la mueve |
|---|---|---|
| New Lead | Diagnóstico completado | La app, al dejar el email |
| Contacted | Consulta WhatsApp | La app, al vincular |
| Proposal Sent | Pago iniciado | Workflow 2 |
| Closed | Pagado | Workflow 4 |

Conviene sumar una etapa **"Pago abandonado"** antes de "Pagado", que la usa el
workflow 3.

## 3. Workflow 1: entrada por WhatsApp

- **Disparador:** "Customer Replied" (respuesta del cliente). Canal: el de WAGHL.
  Filtro: el mensaje contiene `código`.
- **Acción Webhook:**
  - Método `POST`.
  - URL: `https://<dominio-del-diagnóstico>/api/ghl/vincular?secreto=<GHL_WEBHOOK_SECRET>`
  - El cuerpo estándar de GHL ya incluye `contact_id` y el mensaje. Si la acción
    pide datos a mano, agregar: `contact_id = {{contact.id}}` y
    `mensaje = {{message.body}}`.
- **Esperar** 10 segundos, para que los campos ya estén escritos cuando responda
  el bot.
- **Agregar etiqueta** `bot-diagnostico`.

Si la persona edita el mensaje y borra el código, el endpoint responde
`vinculado: false`. En ese caso el bot igual tiene el contexto si escribió desde el
mismo número que dejó en el diagnóstico. Si no, pide el correo y deriva a una
persona.

## 4. Bot: Conversation AI

- **Modo:** piloto automático.
- **Canal:** el de WAGHL. Hay que probar primero con un número de prueba que el bot
  responda en ese canal. WAGHL suele entrar como canal SMS personalizado.
- **Activación:** solo contactos con la etiqueta `bot-diagnostico`.
- **Instrucciones (pegar tal cual):**

```
Eres el asistente de Cris. Tributario, asesor tributario de reorganización e
inversiones patrimoniales con más de 14 años asesorando a inversionistas
inmobiliarios en Chile. Hablas en español de Chile, tratando de "tú", con frases
cortas, cálidas y profesionales. Sin emojis.

La persona acaba de hacer el diagnóstico tributario inmobiliario. Este es su
resultado, úsalo como base de toda la conversación:

{{contact.diag_contexto}}

Etapa: {{contact.diag_etapa}}
Servicio recomendado: {{contact.diag_oferta_recomendada}}
Su diagnóstico completo: {{contact.diag_url_resultado}}

Objetivo: que agende y pague su asesoría de acompañamiento.

Cómo conducir la conversación:
1. Salúdala por su nombre y muéstrale que conoces su resultado: explica en 2 o 3
   frases qué significa su etapa y el principal riesgo u oportunidad según sus
   respuestas.
2. Haz como máximo 2 o 3 preguntas para entender su caso: cuántas propiedades
   tiene hoy, cómo las declara, y qué le preocupa más ahora.
3. Conecta su respuesta con el servicio recomendado: qué revisaría Cris en la
   asesoría y qué se lleva concretamente.
4. Cierra ofreciendo la asesoría de acompañamiento. Valor: $230.000 CLP. Envía
   este enlace, donde elige día y hora y paga en el mismo paso:
   {{contact.diag_url_agenda}}
5. Si duda, resuelve la objeción una vez (valor de ordenar su situación antes de
   que el SII lo haga, tiempo, a quién va dirigida) y vuelve a ofrecer el enlace.

Reglas:
- No des asesoría tributaria específica por chat (montos, estrategias concretas,
  cómo declarar). Eso es justamente lo que se ve en la asesoría.
- Nunca prometas resultados ni hables de "no pagar impuestos". Habla de ordenar,
  pagar lo justo y proteger el patrimonio.
- No inventes datos que no estén en su diagnóstico.
- Si menciona una notificación o fiscalización del SII con plazo encima, una
  herencia en curso o pide hablar con una persona, dile que Cris o su equipo le
  escribirán personalmente y deja de responder.
- Si no tienes su diagnóstico (el contexto está vacío), pídele el correo con el
  que lo hizo y avisa que un asesor lo revisará.
```

- **Derivación a humano:** en "Acciones del bot" o con un workflow, cuando el bot
  deriva → etiqueta `bot-derivar-humano`, quitar `bot-diagnostico` y asignar al
  equipo.

## 5. Workflows con las etiquetas de Encuadrado

Disparador de los tres: "Contact Tag Added". Filtro: contacto con la etiqueta
`diag-whatsapp`, para no tocar los otros funnels.

| Etiqueta | Acciones |
|---|---|
| `pago iniciado encuadrado` | Mover la oportunidad del diagnóstico a "Pago iniciado". El bot sigue activo, sin escribir primero. |
| `pago abandonado encuadrado` | Mover a "Pago abandonado". Esperar 30 min. Enviar por WhatsApp: "Hola {{contact.first_name}}, vi que quedó pendiente tu reserva. Si tuviste algún problema con el pago, aquí está de nuevo el enlace: {{contact.diag_url_agenda}}". El bot sigue activo para responder. |
| `pago confirmado encuadrado` | Mover a "Pagado" con estado "Ganado". Quitar la etiqueta `bot-diagnostico`, lo que apaga el bot. Enviar la confirmación. |

## 6. Variables en Vercel

Settings → Environment Variables → Production. Hay que volver a desplegar después
de guardarlas. El número de WhatsApp también se puede poner en
`/admin/configuracion`.

Los valores (ids de campos, pipeline y etapas) se entregan aparte y no van en el
repo. Las variables que hay que cargar son:

- `WHATSAPP_NUMERO`, `GHL_WEBHOOK_SECRET`
- Contacto: `GHL_CAMPO_FASE`, `GHL_CAMPO_SCORE`, `GHL_CAMPO_OFERTA`,
  `GHL_CAMPO_PROBLEMA`, `GHL_CAMPO_URL_RESULTADO`, `GHL_CAMPO_CODIGO`,
  `GHL_CAMPO_ETAPA`, `GHL_CAMPO_URL_AGENDA`, `GHL_CAMPO_CONTEXTO`
- Oportunidad: `GHL_CAMPO_OPP_CODIGO`, `GHL_CAMPO_OPP_ETAPA`, `GHL_CAMPO_OPP_SCORE`,
  `GHL_CAMPO_OPP_PROBLEMA`, `GHL_CAMPO_OPP_INTENCION`, `GHL_CAMPO_OPP_OFERTA`,
  `GHL_CAMPO_OPP_URL_RESULTADO`, `GHL_CAMPO_OPP_CONTEXTO`
- Pipeline: `GHL_PIPELINE_DIAGNOSTICO`, `GHL_ETAPA_COMPLETADO`, `GHL_ETAPA_WHATSAPP`

Para recuperar un id: GHL → Configuración → Campos personalizados → el campo →
copiar su id; el del pipeline y sus etapas, con la API
`GET /opportunities/pipelines?locationId=…`.

`GHL_API_TOKEN` y `GHL_LOCATION_ID` ya deben estar. El token necesita permisos de
contactos (lectura y escritura) y oportunidades (lectura y escritura).

## 7. Prueba de punta a punta

1. Hacer el diagnóstico con un WhatsApp propio. En GHL, el contacto debe tener los
   campos "Diag …" llenos y la oportunidad debe estar en "Diagnóstico completado".
2. En el resultado, tocar "Prefiero consultar por WhatsApp" y enviar el mensaje sin
   editarlo.
3. Comprobar en GHL:
   - El workflow 1 corrió.
   - La oportunidad pasó a "Consulta WhatsApp".
   - El contacto tiene `diag-whatsapp` y `bot-diagnostico`.
   - En Supabase, `whatsapp_iniciado_at` quedó con fecha.
4. El bot responde citando la etapa correcta y, al cerrar, envía un enlace con
   `canal=whatsapp`.
5. Pagar una reserva de prueba en Encuadrado. La oportunidad debe pasar a "Pagado"
   y el bot dejar de responder.
