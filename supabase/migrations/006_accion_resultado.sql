-- ============================================================
-- 006 — Acción en la página de resultado
--
-- Guarda el último botón que tocó el lead en "Tu siguiente paso":
-- clic_agendar · clic_whatsapp · clic_webinar. NULL si no tocó ninguno.
-- Sale en el CSV del panel como columna accion_resultado.
--
-- Las vistas se recrean otra vez porque expanden d.* al crearse.
--
-- Correr en Supabase: SQL Editor → pegar todo → Run. Es idempotente.
-- ============================================================

ALTER TABLE diagnosticos
  ADD COLUMN IF NOT EXISTS accion_resultado TEXT
  CHECK (accion_resultado IS NULL OR accion_resultado IN
    ('clic_agendar', 'clic_whatsapp', 'clic_webinar'));

ALTER TABLE diagnosticos
  ADD COLUMN IF NOT EXISTS accion_resultado_at TIMESTAMPTZ;

-- CASCADE arrastra las vistas que dependen de esta; se recrean abajo.
DROP VIEW IF EXISTS diagnosticos_embudo CASCADE;

CREATE VIEW diagnosticos_embudo
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
WHERE NOT es_prueba
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
  AND NOT es_prueba
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
WHERE NOT es_prueba
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
  AND NOT es_prueba
GROUP BY ruta, fase, version_cuestionario;

CREATE OR REPLACE VIEW resumen_ofertas
WITH (security_invoker = on) AS
SELECT
  oferta_recomendada,
  problema_principal,
  COUNT(*)      AS total,
  COUNT(email)  AS con_email
FROM diagnosticos
WHERE oferta_recomendada IS NOT NULL
  AND NOT es_prueba
GROUP BY oferta_recomendada, problema_principal;

REVOKE ALL ON diagnosticos_embudo    FROM anon, authenticated;
REVOKE ALL ON resumen_embudo         FROM anon, authenticated;
REVOKE ALL ON abandono_por_pregunta  FROM anon, authenticated;
REVOKE ALL ON resumen_utm            FROM anon, authenticated;
REVOKE ALL ON resumen_fases          FROM anon, authenticated;
REVOKE ALL ON resumen_ofertas        FROM anon, authenticated;
