-- ============================================================
-- 007 — Origen del diagnóstico (espacios separados)
--
-- Cada diagnóstico queda en un espacio según la URL por la que entró:
--   directo              → la portada (/), lo que traen los anuncios.
--   lanzamiento-2026-10  → /lanzamiento, el grupo del lanzamiento
--                          (15 oct – 5 nov 2026), antes del webinar.
--
-- Los espacios no se mezclan: todas las vistas agrupan por origen y el
-- panel filtra por el espacio que está mirando. Los diagnósticos que ya
-- existen quedan como 'directo'. El catálogo de orígenes vive en
-- src/content/origenes.ts; uno nuevo no necesita migración.
--
-- Las vistas se recrean otra vez porque expanden d.* al crearse.
--
-- Configuración: nueva clave url_webinar (enlace del botón del resultado
-- en los lanzamientos), editable en /admin/configuracion.
--
-- Correr en Supabase: SQL Editor → pegar todo → Run. Es idempotente.
-- ============================================================

ALTER TABLE diagnosticos
  ADD COLUMN IF NOT EXISTS origen TEXT NOT NULL DEFAULT 'directo';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'diagnosticos_origen_formato'
  ) THEN
    ALTER TABLE diagnosticos
      ADD CONSTRAINT diagnosticos_origen_formato
      CHECK (origen ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(origen) <= 40);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_diagnosticos_origen
  ON diagnosticos (origen, fecha_creacion DESC);

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

-- Las vistas de resumen cambian de columnas (se suma origen), y
-- CREATE OR REPLACE no permite eso: se borran y se crean de nuevo.
DROP VIEW IF EXISTS resumen_fases;
DROP VIEW IF EXISTS resumen_ofertas;

CREATE VIEW resumen_embudo
WITH (security_invoker = on) AS
SELECT
  origen,
  ruta,
  COUNT(*)                                                          AS iniciados,
  COUNT(*) FILTER (WHERE estado IN ('completado', 'capturado'))      AS completados,
  COUNT(*) FILTER (WHERE estado = 'capturado')                       AS capturados,
  COUNT(*) FILTER (WHERE estado_efectivo = 'abandono_preguntas')     AS abandono_preguntas,
  COUNT(*) FILTER (WHERE estado_efectivo = 'abandono_gate')          AS abandono_gate,
  COUNT(*) FILTER (WHERE estado_efectivo = 'en_curso')               AS en_curso
FROM diagnosticos_embudo
WHERE NOT es_prueba
GROUP BY origen, ruta;

CREATE VIEW abandono_por_pregunta
WITH (security_invoker = on) AS
SELECT
  origen,
  ruta,
  ultima_pregunta_id AS pregunta_id,
  preguntas_respondidas,
  COUNT(*) AS abandonos
FROM diagnosticos_embudo
WHERE estado_efectivo = 'abandono_preguntas'
  AND ultima_pregunta_id IS NOT NULL
  AND NOT es_prueba
GROUP BY origen, ruta, ultima_pregunta_id, preguntas_respondidas;

CREATE VIEW resumen_utm
WITH (security_invoker = on) AS
SELECT
  origen,
  COALESCE(utm_source, '(directo)')     AS utm_source,
  COALESCE(utm_medium, '(ninguno)')     AS utm_medium,
  COALESCE(utm_campaign, '(ninguna)')   AS utm_campaign,
  COALESCE(utm_content, '(ninguno)')    AS utm_content,
  COUNT(*)                                                     AS iniciados,
  COUNT(*) FILTER (WHERE estado IN ('completado', 'capturado')) AS completados,
  COUNT(*) FILTER (WHERE estado = 'capturado')                  AS capturados
FROM diagnosticos_embudo
WHERE NOT es_prueba
GROUP BY 1, 2, 3, 4, 5;

CREATE VIEW resumen_fases
WITH (security_invoker = on) AS
SELECT
  origen,
  ruta,
  fase,
  version_cuestionario,
  COUNT(*)                       AS total,
  COUNT(email)                   AS con_email,
  ROUND(AVG(score_numerico), 1)  AS score_promedio
FROM diagnosticos
WHERE fase IS NOT NULL
  AND NOT es_prueba
GROUP BY origen, ruta, fase, version_cuestionario;

CREATE VIEW resumen_ofertas
WITH (security_invoker = on) AS
SELECT
  origen,
  oferta_recomendada,
  problema_principal,
  COUNT(*)      AS total,
  COUNT(email)  AS con_email
FROM diagnosticos
WHERE oferta_recomendada IS NOT NULL
  AND NOT es_prueba
GROUP BY origen, oferta_recomendada, problema_principal;

COMMENT ON TABLE configuracion IS
  'Ajustes editables desde /admin/configuracion. Claves: meta_pixel_id, meta_capi_token, meta_test_event_code, meta_api_version, url_asesoria, whatsapp_numero, url_webinar.';

REVOKE ALL ON diagnosticos_embudo    FROM anon, authenticated;
REVOKE ALL ON resumen_embudo         FROM anon, authenticated;
REVOKE ALL ON abandono_por_pregunta  FROM anon, authenticated;
REVOKE ALL ON resumen_utm            FROM anon, authenticated;
REVOKE ALL ON resumen_fases          FROM anon, authenticated;
REVOKE ALL ON resumen_ofertas        FROM anon, authenticated;
