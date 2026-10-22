# Webhook de datos del diagnóstico (n8n / Make)

La app envía cada diagnóstico en JSON a una URL de webhook para analizarlo fuera (Sheets, base de datos, IA). Una sola URL recibe el **diagnóstico directo** y los **lanzamientos**: el campo `origen` dice de cuál es cada envío.

Código: [src/lib/webhook-datos.ts](../src/lib/webhook-datos.ts).

## Configurar

1. En n8n: nodo **Webhook**, método `POST`, copiar el *Production URL* (y activar el flujo). En Make: módulo **Webhooks → Custom webhook**.
2. Pegar la URL en `/admin/configuracion` → **Webhook de datos** → Guardar. (Respaldo: variable `WEBHOOK_DATOS_URL` en Vercel.)
3. Opcional pero recomendado: definir `WEBHOOK_DATOS_SECRET` en Vercel. Llega en el header `x-webhook-secret`. En n8n, *Authentication → Header Auth* con ese nombre y valor.
4. **Enviar prueba al webhook** (mismo panel) manda un diagnóstico de ejemplo con `evento: "diagnostico.prueba"` y `es_prueba: true`.
5. Para cargar lo que ya existe: `/admin/exportar-ia` → **Enviar histórico**. Manda el espacio que estás mirando en el panel (directo o lanzamiento), uno por envío.

## Eventos

| `evento` | Cuándo |
|---|---|
| `diagnostico.incompleto` | Terminó las preguntas y vio el gate con su fase (todavía sin datos de contacto) |
| `diagnostico.completado` | Dejó nombre, email y teléfono y vio su diagnóstico |
| `diagnostico.accion` | Tocó un botón del resultado (`accion_resultado`) |
| `diagnostico.abandonado` | El barrido diario lo marcó como abandonado (06:00 UTC) |
| `diagnostico.historico` | Reenvío manual desde el panel |
| `diagnostico.prueba` | Botón de prueba |

Los nombres son los mismos de los eventos de Meta (`DiagnosticoIncompleto`, `DiagnosticoCompletado`) y de las etapas del panel. Ojo: el campo `estado` es el de la base, donde `completado` todavía significa "vio el gate" y `capturado` es quien dejó sus datos.

Un mismo diagnóstico llega varias veces a medida que avanza. Para tener **una fila por persona**, haz upsert por `id` y quédate con el último envío.

## Campos

```json
{
  "evento": "diagnostico.completado",
  "enviado_at": "2026-10-22T14:03:00.000Z",
  "id": "uuid",
  "codigo": "AB12CD34",
  "origen": "lanzamiento-2026-10",
  "origen_nombre": "Lanzamiento oct 2026",
  "es_lanzamiento": true,
  "estado": "capturado",
  "estado_efectivo": "capturado",
  "fecha": "2026-10-22",
  "es_prueba": false,
  "propiedades": "Entre 5 y 10",
  "avatar": "Sí",
  "ruta": "A · ...",
  "fase": "A2",
  "fase_titulo": "...",
  "score": 14,
  "problema_principal": "texto legible",
  "problema_otro": null,
  "intencion_previa": "texto legible",
  "texto_libre": "...",
  "oferta_recomendada": "nombre de la oferta",
  "escribio_por_whatsapp": false,
  "respuestas": [{ "pregunta": "texto completo", "respuesta": "texto" }],
  "contacto": { "nombre": "...", "email": "...", "telefono": "..." },
  "accion_resultado": null,
  "version_cuestionario": "...",
  "preguntas_respondidas": 9,
  "total_preguntas": 9,
  "ultima_pregunta_id": "...",
  "utm": { "source": "...", "medium": "...", "campaign": "...", "content": "...", "term": "..." },
  "referrer": "...",
  "fechas": { "creado": "...", "completado": "...", "capturado": "...", "accion": "..." },
  "url_resultado": "https://.../resultado/<token>"
}
```

- `estado`: `iniciado` · `completado` · `capturado` (lo guardado en la base).
- `estado_efectivo`: `en_curso` · `abandono_preguntas` · `abandono_gate` · `capturado` (lo mismo que ve el panel).
- `respuestas` empieza por la pregunta de cuántas propiedades tiene (la que define la ruta).
- **Incluye datos personales** (contacto y `url_resultado`, que abre el resultado de la persona): el destino debe ser privado.

## Flujo sugerido en n8n

`Webhook` → `IF es_prueba = false` → `Switch por origen` → `Google Sheets: Append or Update` (columna de coincidencia: `id`), una hoja por espacio. Para análisis con IA, guarda `respuestas` y `texto_libre` como JSON/texto en una columna.

## Seguridad y entrega

- `x-firma: sha256=<hex>` es el HMAC-SHA256 del cuerpo con `WEBHOOK_DATOS_SECRET`, por si el destino quiere verificarlo.
- Se envía después de responder a la persona (`after()`), con 5 s de timeout y un reintento ante errores 5xx o de red. Si falla, el quiz sigue normal y queda en el log de Vercel (`[webhook-datos]`). Lo que no llegó se recupera con **Enviar histórico**.
- `diagnostico.abandonado` sale junto con el abandono que se manda a Meta: si Meta no está configurado, ese evento no se envía (los abandonos igual llegan con el histórico).
