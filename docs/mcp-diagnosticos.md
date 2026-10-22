# Conector MCP de los diagnósticos (claude.ai)

Claude puede consultar los diagnósticos directamente desde claude.ai: el embudo por etapa, dónde abandonan, los resultados por UTM y cada diagnóstico con sus respuestas. Ve el **diagnóstico directo** y los **lanzamientos**, y **solo puede leer**: no hay ninguna herramienta que cambie o borre datos.

Código: [src/lib/mcp/](../src/lib/mcp/) y [src/app/api/mcp/route.ts](../src/app/api/mcp/route.ts).

## Activarlo

1. **Crear la llave de Claude.** Es su "cuenta", distinta de `ADMIN_PASSWORD`:
   ```
   openssl rand -base64 32
   ```
   Guárdala en Vercel como `MCP_LLAVE` (Production) y vuelve a desplegar.
2. **Agregar el conector en claude.ai.** Settings → Connectors → *Add custom connector*:
   - Nombre: `Diagnóstico Cris`
   - URL: `https://<dominio-del-diagnóstico>/api/mcp`
3. Al apretar **Connect**, se abre la pantalla "Dar acceso a los diagnósticos". Pega la llave y apreta **Autorizar**.
4. En un chat, activa el conector (menú de herramientas) y pregunta, por ejemplo:
   - "¿Cómo va el embudo del lanzamiento de octubre comparado con el directo?"
   - "¿En qué pregunta abandonan más en la ruta B?"
   - "Lee los textos libres de quienes vieron el gate y no dejaron sus datos, y agrúpalos por objeción."
   - "¿Qué anuncio (utm_content) trae más completados?"
   - "Muéstrame el diagnóstico AB12CD34."
   - "Compara las dos semanas del lanzamiento: ¿mejoró el paso del gate?"
   - "¿Qué respuesta de la ruta B predice mejor que alguien deje sus datos?"
   - "Lee el texto del gate y los textos libres de quienes se van ahí, y propón 3 cambios."
   - "Del pipeline del diagnóstico, ¿cuántos completados terminaron en venta?"

En un plan Team/Enterprise, el conector lo agrega un admin de la organización y cada persona hace el paso 3.

## Herramientas

| Herramienta | Qué devuelve |
|---|---|
| `listar_espacios` | Espacios (directo, lanzamientos), etapas, rutas y fases |
| `resumen_embudo` | Iniciados → vieron el gate → completados, con %, por ruta, fase, problema, avatar, botón del resultado, WhatsApp |
| `abandono_por_pregunta` | En qué pregunta se van (con su texto) y cuántos abandonan en el gate |
| `resumen_atribucion` | Iniciados / gate / completados por utm source · medium · campaign · content |
| `listar_diagnosticos` | Lista filtrable (espacio, etapa, ruta, fase, fechas, UTM, texto libre). Con `detalle: true` trae todas las respuestas |
| `ver_diagnostico` | El registro completo de una persona, por código, email o teléfono |
| `cruzar` | Cualquier variable contra otra (utm_content × etapa, problema × completó, `respuesta:b3` × fase). Con `filas: dia` o `semana` da la serie en el tiempo |
| `comparar_periodos` | Dos grupos lado a lado con la diferencia: dos rangos de fechas, o lanzamiento contra directo |
| `ver_cuestionario` | Las preguntas de cada ruta con sus opciones, puntos y los rangos de score de cada fase |
| `ver_roadmaps` | Qué ve cada fase antes del gate (preview) y después (3 pasos, CTA), y qué oferta le toca según su problema |
| `ver_ofertas` | Los servicios con su precio interno y las reglas para recomendarlos |
| `ver_textos_del_sitio` | El copy publicado: portadas (directo y lanzamiento), quiz, gate, resultado, correo, WhatsApp |
| `estado_en_ghl` | Una persona en GoHighLevel: etiquetas, oportunidad (pipeline y etapa), última conversación |
| `resumen_pipeline` | Oportunidades por etapa y por estado (abiertas, ganadas, perdidas) con valor, en el pipeline del diagnóstico |

Las etapas son las del panel y Meta: `abandono_gate` = vio el gate y no dejó sus datos (DiagnosticoIncompleto); `capturado` = completado, dejó sus datos (DiagnosticoCompletado). Las pruebas internas quedan fuera salvo que se pida `incluir_pruebas`.

El registro completo tiene el mismo formato que el [webhook de datos](webhook-datos.md) y la exportación para IA.

## Seguridad

- **Datos personales:** Claude ve nombre, email y teléfono. Cualquiera con la llave puede conectarse, así que compártela solo con quien deba ver los leads.
- **Revocar el acceso:** cambia `MCP_LLAVE` en Vercel y vuelve a desplegar. Todos los conectores quedan desconectados hasta que alguien autorice con la llave nueva.
- **Duración:** el acceso dura 24 h y claude.ai lo renueva solo hasta por 90 días. Después hay que volver a autorizar.
- Solo se aceptan URLs de retorno de `claude.ai` / `claude.com` (y `localhost` para pruebas). Para otro cliente, agrega su URL exacta en `MCP_REDIRECTS_EXTRA`.
- La pantalla de autorización acepta 5 intentos por minuto por IP.
- GoHighLevel: `estado_en_ghl` y `resumen_pipeline` solo leen (GET, y la búsqueda de contactos). Usan el mismo `GHL_API_TOKEN`; para ver conversaciones el token necesita permiso de lectura de conversaciones.
- Sin tablas nuevas: los tokens son mensajes firmados con una clave derivada de `MCP_LLAVE`.

## Probar en local

```
MCP_LLAVE=prueba npm run dev
npx @modelcontextprotocol/inspector
```
En el Inspector: transporte *Streamable HTTP*, URL `http://localhost:3000/api/mcp`, *Connect* → autoriza con `prueba`. Sin Supabase en `.env.local`, las herramientas leen el dataset demo.
