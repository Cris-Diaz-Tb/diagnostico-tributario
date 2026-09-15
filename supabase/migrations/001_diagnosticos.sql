-- ============================================================
-- Diagnóstico Cris. Tributario: schema completo
--
-- Proyecto nuevo de Supabase: SQL Editor → pegar todo → Run.
-- Consolida en un solo archivo el schema base, la medición del embudo
-- y los campos del cuestionario (en el proyecto original eran 3
-- migraciones; aquí no hay datos previos que migrar).
-- ============================================================

CREATE TABLE IF NOT EXISTS diagnosticos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_resultado TEXT UNIQUE NOT NULL,

  -- Contacto: NULL hasta que la persona deja su email
  email TEXT,
  email_capturado_at TIMESTAMPTZ,
  nombre TEXT,
  telefono TEXT,
  consentimiento BOOLEAN NOT NULL DEFAULT false,
  consentimiento_at TIMESTAMPTZ,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Resultado. Ruta A: hasta 5 propiedades · B: 6 a 15 · C: 16 o más.
  -- Fase y score se calculan al completar, por eso admiten NULL.
  ruta TEXT NOT NULL CHECK (ruta IN ('A', 'B', 'C')),
  fase TEXT CHECK (fase IN ('A1','A2','A3','B1','B2','B3','C1','C2','C3')),
  score_numerico INT,
  respuestas JSONB NOT NULL DEFAULT '[]'::jsonb,
  version_cuestionario SMALLINT NOT NULL DEFAULT 1,

  -- Clasificación (no suma al score)
  problema_principal TEXT CHECK (problema_principal IS NULL OR problema_principal IN
    ('pago_de_mas', 'notificacion_sii', 'comprar_mas', 'sociedad', 'herencia', 'otro')),
  problema_otro TEXT,
  nivel_intencion TEXT CHECK (nivel_intencion IS NULL OR nivel_intencion IN
    ('nada', 'contenido_gratis', 'compro_producto', 'contrato_servicio')),
  texto_abierto TEXT,
  -- Servicio que corresponde ofrecer según fase y problema (bloque 8.2)
  oferta_recomendada TEXT CHECK (oferta_recomendada IS NULL OR oferta_recomendada IN
    ('asesoria_patrimonial', 'sociedad_inversiones', 'regularizacion_sii', 'patrimonial_internacional')),

  -- Ciclo de vida dentro del quiz
  estado TEXT NOT NULL DEFAULT 'iniciado' CHECK (estado IN ('iniciado', 'completado', 'capturado')),
  iniciado_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completado_at TIMESTAMPTZ,
  ultima_actividad_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  preguntas_respondidas INT NOT NULL DEFAULT 0,
  total_preguntas INT,
  ultima_pregunta_id TEXT,

  -- Atribución
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  landing_path TEXT,
  fbclid TEXT,
  gclid TEXT,
  ttclid TEXT,
  fbp TEXT,
  fbc TEXT,

  -- Para enviar el evento de abandono a Meta más tarde
  client_ip TEXT,
  user_agent TEXT,
  evento_id TEXT,
  capi_abandono_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_diagnosticos_fecha ON diagnosticos (fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_ruta_fase ON diagnosticos (ruta, fase);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_token ON diagnosticos (token_resultado);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_estado ON diagnosticos (estado);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_actividad ON diagnosticos (ultima_actividad_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_utm ON diagnosticos (utm_source, utm_campaign);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_problema ON diagnosticos (problema_principal);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_oferta ON diagnosticos (oferta_recomendada);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_capi_abandono
  ON diagnosticos (capi_abandono_at) WHERE capi_abandono_at IS NULL;

-- ============================================================
-- Seguridad: RLS activado SIN políticas. Nadie puede leer ni escribir
-- con la anon key; todo pasa por el servidor con la service role key.
-- ============================================================
ALTER TABLE diagnosticos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON diagnosticos FROM anon, authenticated;

-- ============================================================
-- VISTAS (security_invoker = on: respetan el RLS de la tabla)
-- Ninguna agregación se calcula en el frontend.
-- ============================================================

-- Abandonado = 30 minutos sin actividad y sin email.
CREATE OR REPLACE VIEW diagnosticos_embudo
WITH (security_invoker = on) AS
SELECT
  d.*,
  CASE
    WHEN d.estado = 'capturado' THEN 'capturado'
    WHEN d.ultima_actividad_at >= now() - interval '30 minutes' THEN 'en_curso'
    WHEN d.estado = 'completado' THEN 'abandono_gate'
    ELSE 'abandono_preguntas'
  END AS estado_efectivo
FROM diagnosticos d;

CREATE OR REPLACE VIEW resumen_embudo
WITH (security_invoker = on) AS
SELECT
  ruta,
  COUNT(*)                                                          AS iniciados,
  COUNT(*) FILTER (WHERE estado IN ('completado', 'capturado'))      AS completados,
  COUNT(*) FILTER (WHERE estado = 'capturado')                       AS capturados,
  COUNT(*) FILTER (WHERE estado_efectivo = 'abandono_preguntas')     AS abandono_preguntas,
  COUNT(*) FILTER (WHERE estado_efectivo = 'abandono_gate')          AS abandono_gate,
  COUNT(*) FILTER (WHERE estado_efectivo = 'en_curso')               AS en_curso
FROM diagnosticos_embudo
GROUP BY ruta;

CREATE OR REPLACE VIEW abandono_por_pregunta
WITH (security_invoker = on) AS
SELECT
  ruta,
  ultima_pregunta_id AS pregunta_id,
  preguntas_respondidas,
  COUNT(*) AS abandonos
FROM diagnosticos_embudo
WHERE estado_efectivo = 'abandono_preguntas'
  AND ultima_pregunta_id IS NOT NULL
GROUP BY ruta, ultima_pregunta_id, preguntas_respondidas;

CREATE OR REPLACE VIEW resumen_utm
WITH (security_invoker = on) AS
SELECT
  COALESCE(utm_source, '(directo)')     AS utm_source,
  COALESCE(utm_medium, '(ninguno)')     AS utm_medium,
  COALESCE(utm_campaign, '(ninguna)')   AS utm_campaign,
  COALESCE(utm_content, '(ninguno)')    AS utm_content,
  COUNT(*)                                                     AS iniciados,
  COUNT(*) FILTER (WHERE estado IN ('completado', 'capturado')) AS completados,
  COUNT(*) FILTER (WHERE estado = 'capturado')                  AS capturados
FROM diagnosticos_embudo
GROUP BY 1, 2, 3, 4;

CREATE OR REPLACE VIEW resumen_fases
WITH (security_invoker = on) AS
SELECT
  ruta,
  fase,
  version_cuestionario,
  COUNT(*)                       AS total,
  COUNT(email)                   AS con_email,
  ROUND(AVG(score_numerico), 1)  AS score_promedio
FROM diagnosticos
WHERE fase IS NOT NULL
GROUP BY ruta, fase, version_cuestionario;

-- Qué servicio se recomienda más y cuántos de esos dejan contacto.
CREATE OR REPLACE VIEW resumen_ofertas
WITH (security_invoker = on) AS
SELECT
  oferta_recomendada,
  problema_principal,
  COUNT(*)      AS total,
  COUNT(email)  AS con_email
FROM diagnosticos
WHERE oferta_recomendada IS NOT NULL
GROUP BY oferta_recomendada, problema_principal;

REVOKE ALL ON diagnosticos_embudo    FROM anon, authenticated;
REVOKE ALL ON resumen_embudo         FROM anon, authenticated;
REVOKE ALL ON abandono_por_pregunta  FROM anon, authenticated;
REVOKE ALL ON resumen_utm            FROM anon, authenticated;
REVOKE ALL ON resumen_fases          FROM anon, authenticated;
REVOKE ALL ON resumen_ofertas        FROM anon, authenticated;
