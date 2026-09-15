# Diagnóstico tributario inmobiliario · Cris. Tributario

Lead magnet de diagnóstico para inversionistas inmobiliarios en Chile. La persona elige cuántas propiedades tiene, responde entre 10 y 11 pantallas, ve su etapa gratis, deja su correo para desbloquear 3 pasos concretos y recibe una recomendación de asesoría acorde a su caso.

Construido a partir del blueprint de la plataforma de diagnóstico de Ads House, con el contenido del documento de insumos diligenciado por Cris (agosto 2026).

## Cómo funciona

| Ruta | Quién entra | Preguntas puntuadas | Rango | Etapas |
|---|---|---|---|---|
| A · Inversionista inicial | Hasta 5 propiedades | 7 | 7 a 21 | 7-11 · 12-16 · 17-21 |
| B · Inversionista intermedio | 6 a 15 propiedades | 7 | 7 a 21 | 7-11 · 12-16 · 17-21 |
| C · Inversionista consolidado | 16 o más | 8 | 8 a 24 | 8-13 · 14-19 · 20-24 |

Cada ruta termina con tres pantallas que no suman puntos: problema principal, qué ha hecho ya y una pregunta abierta opcional.

El problema principal decide el cierre y la **oferta recomendada**, que se guarda en la base, sale en el panel y el CSV, y viaja a GoHighLevel como etiqueta. Quien marca una notificación del SII recibe siempre la regularización, en cualquier etapa. El precio de cada servicio es interno y nunca se muestra al usuario.

## Correr en local (modo demo)

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin configurar nada, el flujo completo funciona sin guardar datos ni enviar correos. El panel http://localhost:3000/admin muestra datos de ejemplo con la contraseña de `ADMIN_PASSWORD`.

## Dónde se editan los textos

Todo el contenido vive en `src/content/`. Cambiar textos no requiere tocar lógica.

| Archivo | Contenido |
|---|---|
| `preguntas.ts` | Pregunta de propiedades, las 3 rutas, opciones y pesos |
| `roadmaps.ts` | Los 9 resultados: diagnóstico visible, 3 pasos, cierre y cierre por problema |
| `ofertas.ts` | Catálogo de asesorías con precio interno y regla del SII |
| `copy.ts` | Portada, formulario, correo, mensaje de WhatsApp, aviso legal, errores |

Si cambian preguntas o pesos, ajustar los umbrales en `src/lib/scoring.ts`, correr `npm test` y subir `VERSION_CUESTIONARIO`.

Los tests fallan si un texto visible revela precios, promete resultados, insinúa evasión o usa emojis.

## Puesta en producción

### 1. Supabase
1. Proyecto nuevo en supabase.com.
2. SQL Editor: pegar `supabase/migrations/001_diagnosticos.sql` completo y ejecutar.
3. Settings, API: copiar Project URL y service_role key a `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
4. Verificar el RLS: desde la consola del navegador, con la anon key, `select` sobre `diagnosticos` debe devolver vacío o error.

### 2. Correo (Resend)
1. Verificar en Resend el dominio del remitente, con SPF y DKIM en su DNS.
2. Completar `RESEND_API_KEY` y `EMAIL_FROM`.

### 3. GoHighLevel
1. En la subcuenta de Cris crear una Private Integration con permiso de contactos.
2. Completar `GHL_API_TOKEN` y `GHL_LOCATION_ID`.
3. Crear los workflows disparados por etiqueta. Etiquetas que envía la plataforma:

```
diagnostico
diag-ruta-a | diag-ruta-b | diag-ruta-c
diag-fase-a1 … diag-fase-c3
diag-oferta-asesoria_patrimonial | diag-oferta-sociedad_inversiones | diag-oferta-regularizacion_sii | diag-oferta-patrimonial_internacional
diag-problema-pago_de_mas | diag-problema-notificacion_sii | diag-problema-comprar_mas | diag-problema-sociedad | diag-problema-herencia | diag-problema-otro
diag-intencion-nada | diag-intencion-contenido_gratis | diag-intencion-compro_producto | diag-intencion-contrato_servicio
```

4. Opcional: crear campos personalizados de contacto y poner sus ids en las variables `GHL_CAMPO_*`.
5. Hacer un diagnóstico de prueba y confirmar en GHL que el contacto llegó con sus etiquetas.

### 4. Botón de asesoría
`NEXT_PUBLIC_URL_ASESORIA` con el enlace `https://wa.me/569XXXXXXXX` del número comercial. El mensaje llega prellenado con el resultado y un código de 8 caracteres que coincide con el inicio del id en el panel.

### 5. Meta, PostHog y cron
- Pixel y API de Conversiones: `NEXT_PUBLIC_META_PIXEL_ID`, `META_PIXEL_ID`, `META_CAPI_TOKEN`.
- PostHog: `NEXT_PUBLIC_POSTHOG_KEY`.
- `CRON_SECRET`: cadena larga aleatoria. El cron diario de `vercel.json` envía a Meta los abandonos y purga incompletos de más de 180 días.

### 6. Vercel
1. Subir el repo a GitHub y conectarlo en Vercel.
2. Copiar todas las variables de `.env.local` a Settings, Environment Variables.
3. `NEXT_PUBLIC_SITE_URL` con el dominio final y `META_TEST_EVENT_CODE` vacío.
4. Apuntar el subdominio desde el DNS del dominio a Vercel.

### 7. Prueba final
Seguir la sección 15 del blueprint: flujo completo por las 3 rutas, fila en Supabase con estado `capturado`, correo recibido, enlace del resultado en incógnito, contacto en GHL, eventos deduplicados en Meta, 401 del cron sin token, 429 al pasar el límite de peticiones.

## Pendientes antes de lanzar tráfico

- Logo y favicon de la marca (pendiente de Bryan) en `public/` y en el encabezado.
- Imagen para redes 1200 por 630.
- Dominio o subdominio definitivo y acceso a su DNS.
- Remitente de correo en un dominio que se pueda verificar en Resend.
- Revisión legal de `/privacidad` y cambiar `REVISADA_POR_ABOGADO` a `true`.
- Validación de Cris de los pasos con referencias normativas (Ley 16.271, rentas pasivas, Norma General Antielusiva).
- Prueba con 3 clientes reales de Cris, uno por extremo, para confirmar que caen en la etapa que él les asignaría.

## Tests

```bash
npm test
```
