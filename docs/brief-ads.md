# Brief para copy de ads — Diagnóstico Tributario Inmobiliario de Cris. Tributario

Este documento es el contexto completo para escribir anuncios que lleven tráfico al
diagnóstico. Está sacado del código del producto, no de suposiciones: las preguntas,
los resultados y las reglas de marca son literales de `src/content/`.

Mercado: **Chile**. Idioma: **español de Chile, tratando de "tú"**.

---

## 1. Qué es el producto

Un diagnóstico gratuito de 2 minutos para inversionistas inmobiliarios chilenos.
La persona responde un cuestionario y recibe:

- La **etapa** en que está su patrimonio (1 de 9 resultados posibles).
- Un diagnóstico escrito de su situación.
- **3 pasos concretos** que puede aplicar esta semana sin contratar nada.
- Un botón para **agendar una asesoría** directamente en el calendario.

Es un lead magnet. El negocio detrás son asesorías tributarias pagadas.

**Cris. Tributario** es el asesor: 14+ años asesorando inversionistas inmobiliarios
en Chile, +130.000 seguidores en Instagram (`@cris.tributario`). Firma como
"Asesor Tributario de Reorganización e Inversiones Patrimoniales".

---

## 2. El embudo completo

```
Anuncio
  → Landing (portada con el gancho y el botón "Quiero mi diagnóstico gratis")
  → Pregunta de bifurcación: ¿cuántas propiedades tienes?
  → 7 u 8 preguntas puntuadas + 2 de clasificación + 1 abierta opcional
  → Pantalla de análisis ("Estamos revisando tu caso con calma")
  → Resultado parcial VISIBLE: título + diagnóstico (genera curiosidad)
  → GATE: nombre + correo + WhatsApp, los tres obligatorios
  → Resultado completo: los 3 pasos
  → Botón "Quiero agendar mi asesoría" → calendario
```

Duración real: 2 a 3 minutos. Son 10 u 11 pantallas.

**Dato clave para el copy:** el formulario pide **WhatsApp obligatorio**. Eso sube la
fricción. El anuncio tiene que traer gente con intención real, no clics baratos. No
prometas "sin dar datos" ni "anónimo": es falso en el paso del gate. Sí puedes decir
que empieza sin registro previo, porque el formulario viene al final, después de que
ya vio parte de su resultado.

---

## 3. A dónde mandar el tráfico

La URL de producción hoy es un dominio de Vercel:
`https://diagnostico-tributario-rho.vercel.app`

**Esto hay que resolverlo antes de invertir.** Un `.vercel.app` en un anuncio de tema
financiero perjudica la confianza y complica la verificación de dominio en Meta, que
es necesaria para la medición agregada de eventos. El plan del proyecto contempla
`diagnostico.cristributario.cl`, pero ese subdominio todavía no resuelve. Pregunta por
el dominio definitivo antes de escribir los enlaces finales.

---

## 4. La audiencia: tres segmentos por tamaño

El cuestionario bifurca en la primera pregunta, y ese corte es el mejor criterio de
segmentación para las campañas:

| Ruta | Nombre visible | Tamaño | Perfil |
|---|---|---|---|
| **A** | Inversionista inicial | Hasta 5 propiedades | Tiene 1 a 5 arriendos, declara "a ciegas", su contador se encarga. Dolor: paga de más sin saberlo. |
| **B** | Inversionista intermedio | 6 a 15 propiedades | Ya tiene sociedades, pero mezcladas con lo operativo. Dolor: patrimonio expuesto y beneficios sin usar. |
| **C** | Inversionista consolidado | 16 o más | Patrimonio grande, algo en el extranjero, sin holding formal. Dolor: falta blindaje integral y plan de sucesión. |

La ruta A es el volumen. La C es el ticket alto pero el público más chico.

---

## 5. Los ángulos reales, en palabras de la audiencia

El cuestionario pregunta: *"Si tuvieras que señalar UNA sola cosa que hoy te tiene más
frenado con tus propiedades, ¿cuál es?"*. Estas seis opciones son **los ángulos de
anuncio**, literalmente redactados como la audiencia piensa el problema:

1. **Paga de más** — "Estoy pagando más impuesto del que debería y no sé cómo bajarlo"
2. **SII / notificación** — "El SII me notificó, o temo que me notifique, por ingresos de arriendo"
3. **Quiere comprar más** — "Quiero comprar más propiedades, pero me frena el impacto tributario"
4. **Sociedad** — "Necesito crear o ajustar una sociedad de inversiones"
5. **Herencia** — "Quiero proteger mi patrimonio pensando en el impuesto a la herencia"
6. **Otra cosa** (texto libre)

El negocio trata el **SII como prioritario sobre todo lo demás**: quien marca una
notificación recibe siempre la oferta de regularización, sin importar su etapa. Es el
dolor más urgente y el que mejor convierte, pero también el más delicado
(ver reglas en la sección 8).

También se pregunta qué ha hecho la persona hasta ahora, que sirve para calibrar el
nivel de consciencia del anuncio:

- **Nada todavía**, es la primera vez que lo piensa en serio
- Ha visto **contenido gratuito** en redes
- Ya **compró un curso o ebook** sobre el tema
- Ya **contrató a un contador, abogado o asesor**

---

## 6. Materia prima: el lenguaje del dolor

### Los 9 resultados posibles (títulos)

Ruta A: *Patrimonio a la deriva* · *Vas ordenando, pero expones tu patrimonio* ·
*Listo para estructurar y escalar*

Ruta B: *Patrimonio operativo y expuesto* · *Beneficios que no estás capitalizando* ·
*A un paso de blindar tu patrimonio*

Ruta C: *Diversificado, pero sin blindaje integral* · *Estructura sólida, falta afinar
el detalle* · *Patrimonio consolidado y protegido*

### Tres diagnósticos completos, como muestra de voz

**A1 — Patrimonio a la deriva:**
> "Hoy pagas impuesto sobre tus arriendos casi a ciegas: no tienes claro el régimen
> bajo el que declaras, ni qué gastos podrías estar restando legalmente. No es que te
> falte comprensión, es que nadie te enseñó a mirar tus propiedades con ojo tributario,
> solo con ojo inmobiliario. Si sigues así, vas a seguir pagando más impuesto del que
> la ley te exige, y cada propiedad nueva que compres va a repetir el mismo problema,
> ahora multiplicado."

**B1 — Patrimonio operativo y expuesto:**
> "Tu patrimonio inmobiliario hoy vive mezclado con tus sociedades operativas, las que
> tienen riesgo comercial real. Eso significa que un problema legal o comercial en
> cualquiera de esas empresas puede terminar afectando propiedades que nada tienen que
> ver con ese riesgo. No es falta de visión de tu parte: cuando esas sociedades se
> crearon, probablemente el objetivo era operar, no proteger patrimonio."

**C1 — Diversificado, pero sin blindaje integral:**
> "Ya diversificaste más allá de los bienes raíces, con otros instrumentos y quizás
> algo en el extranjero, pero tu patrimonio no está bajo una estructura que lo mire
> como un todo. Cada activo se administra por su lado, y eso hace que decisiones
> tributarias importantes se tomen sin ver el efecto conjunto en tu carga tributaria
> total ni en tu plan de sucesión."

Fíjate en el patrón: **nombra el costo de no actuar, sin culpar a la persona**.
Siempre hay una frase que la desculpabiliza ("no es que te falte comprensión",
"no es falta de visión de tu parte"). Replica eso en los anuncios.

### Preguntas del cuestionario que funcionan como gancho

Cada pregunta puntuada es un dolor latente ya validado. Las más aprovechables:

- "¿Sabes exactamente bajo qué régimen tributario declaras el arriendo de tus propiedades?"
- "Cuando declaras el arriendo, ¿restas los gastos que la ley te permite (intereses, contribuciones, gastos comunes, gastos básicos)?"
- "En los últimos 3 años, ¿has recibido alguna carta o notificación del SII por tus propiedades?"
- "Si una de tus sociedades operativas tuviera un problema legal grande, ¿tu patrimonio inmobiliario quedaría expuesto?"
- "¿Sabes cómo afectaría el impuesto a la herencia a tus propiedades si algo te pasara hoy?"
- "¿Cada cuánto haces una revisión preventiva completa de tu estructura, antes de que el SII la mire primero?"

---

## 7. La landing actual (para que el anuncio haga match)

- **Titular:** "¿Cuánto impuesto estás pagando de más por tus propiedades?"
- **Bajada:** "Responde unas pocas preguntas y descubre en 2 minutos en qué etapa está tu patrimonio inmobiliario, y qué hacer esta semana para pagar menos y proteger lo que construiste."
- **Bullets:** diagnóstico personalizado según número de propiedades y situación ante el SII · 3 pasos concretos aplicables esta semana, sin contratar nada · basado en 14+ años asesorando inversionistas inmobiliarios en Chile
- **Botón:** "Quiero mi diagnóstico gratis"
- **Nota:** "Sin registro previo · Tus respuestas son confidenciales"
- **Prueba social:** "+130.000 personas siguen a Cris. Tributario en Instagram."

El anuncio debe continuar este mensaje, no contradecirlo. Si el anuncio promete algo
que la landing no dice, cae la conversión y sube el costo.

---

## 8. Reglas que el copy NO puede romper

Estas están escritas en el código del producto y **hay tests automáticos que fallan si
se cuelan**. Aplican a los anuncios igual que al producto:

1. **Nunca prometer resultados garantizados** ni "cero riesgo" ante el SII.
2. **Nunca insinuar evasión**, ni "no pagar impuestos". El marco es siempre *"usar lo
   que la ley ya te permite"*, *"pagar lo que corresponde, no más"*.
3. **Nunca revelar precios** en material de cara al público.
4. **Nunca nombrar ni atacar a colegas o competidores** (contadores incluidos: el copy
   habla de "más allá de tu contador", nunca en contra de él).

Además, el diagnóstico lleva siempre este descargo, que conviene respetar en el tono:

> "Este diagnóstico es orientativo y se basa solo en tus respuestas. No constituye
> asesoría tributaria ni reemplaza la revisión de tu caso por un profesional."

---

## 9. Política de Meta que aplica a este rubro

Este es un punto delicado y hay que escribir pensando en él desde el primer borrador.

Meta prohíbe los anuncios que **afirman o implican que conocen un atributo personal**
de quien los ve, y la situación financiera entra en esa categoría. Un titular como
*"Estás pagando demasiado impuesto por tus propiedades"* le atribuye directamente a la
persona una condición financiera, y ese es exactamente el patrón que se rechaza.

La salida es reformular hacia lo general o lo aspiracional:

- ❌ "Estás pagando más impuesto del que deberías."
- ✅ "Muchos inversionistas inmobiliarios en Chile pagan más impuesto del que la ley exige."
- ❌ "¿El SII te notificó?"
- ✅ "Qué hacer si llega una notificación del SII por tus arriendos."
- ❌ "Tu patrimonio está expuesto."
- ✅ "Cuando las propiedades viven en la misma sociedad que el negocio, el riesgo se comparte."

Ojo: el titular actual de la landing (*"¿Cuánto impuesto estás pagando de más...?"*)
funciona en la landing, pero **no lo copies tal cual al anuncio**.

Verifica las políticas vigentes antes de entregar; cambian seguido.

---

## 10. Medición

El sitio ya tiene instrumentado:

- **Pixel de Meta + API de Conversiones** con deduplicación por `event_id`.
- Eventos: `DiagnosticoIniciado`, `DiagnosticoCompletado`, **`Lead`** (el estándar) y
  `DiagnosticoAbandonado`.
- **Optimiza las campañas por `Lead`.** Se dispara en el gate, cuando la persona
  entrega nombre, correo y WhatsApp. Es el evento con intención real.
- Captura automática de `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`,
  `utm_term`, más `fbclid`, `gclid` y `ttclid`. Usa UTMs consistentes por ángulo y por
  creativo: el panel interno cruza campaña contra etapa del lead.
- Los datos de contacto viajan hasheados a la API de Conversiones, así que la calidad
  de coincidencia depende de que el formulario se complete. Otra razón para traer
  tráfico cualificado.

---

## 11. Contexto interno (NO usar en el copy)

Las asesorías que se venden después del diagnóstico:

| Servicio | Para quién | Precio interno |
|---|---|---|
| Asesoría tributaria patrimonial | 1 a 15 propiedades, quieren pagar menos y ordenar | CLP 230.000 |
| Constitución de sociedad de inversiones | Separar patrimonio del riesgo operativo, planificar herencia | CLP 230.000 |
| Regularización ante el SII | Notificados, o temen serlo, por arriendos no declarados | CLP 230.000 |
| Patrimonial internacional | Consolidados con inversión en otros instrumentos o en el extranjero | CLP 360.000 |

Sirve para dimensionar cuánto se puede pagar por lead. **Los precios nunca aparecen en
el diagnóstico, el correo, la página de resultado ni los anuncios.**

---

## 12. Qué entregar

Para cada ángulo (mínimo los de las secciones 5 y 6), en Meta (Facebook + Instagram):

- **Texto principal:** apunta a que lo esencial quede en los primeros ~125 caracteres,
  que es lo que se ve antes del "ver más".
- **Titular:** corto, del orden de 27 a 40 caracteres.
- **Descripción:** ~27 caracteres.
- **CTA:** el botón del sistema ("Más información" suele rendir mejor que "Registrarte"
  para un lead magnet de diagnóstico, pero conviene testearlo).

Confirma los límites vigentes de cada ubicación antes de entregar; Meta los ajusta.

Entrega al menos 3 variantes por ángulo, cambiando el mecanismo (pregunta, dato,
historia, error común) y no solo las palabras.

---

## 13. Decisiones que hay que consultar antes de cerrar

1. **El dominio definitivo** para los enlaces (sección 3).
2. **Presupuesto y plataformas**: el sitio está instrumentado para Meta, Google y
   TikTok, pero solo Meta tiene el pixel configurado hoy.
3. **Si se puede usar la cara y la voz de Cris** en los creativos, y si hay material de
   video existente en su Instagram para adaptar.
4. **Si hay casos reales o cifras propias** que se puedan citar. Hoy la única prueba
   social disponible son los +130.000 seguidores y los 14+ años de experiencia.
