-- ============================================================
-- 002 — Configuración editable desde el panel /admin
--
-- Antes: el pixel de Meta y el enlace de asesoría vivían solo en
-- variables de entorno, así que cambiarlos exigía entrar a Vercel y
-- volver a desplegar.
--
-- Ahora: se guardan aquí y el panel los edita. Las variables de entorno
-- siguen funcionando como respaldo: si una clave no está en esta tabla,
-- se usa la del entorno.
--
-- Correr en Supabase: SQL Editor → pegar todo → Run. Es idempotente.
-- ============================================================

CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT,
  actualizado_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE configuracion IS
  'Ajustes editables desde /admin/configuracion. Claves: meta_pixel_id, meta_capi_token, meta_test_event_code, meta_api_version, url_asesoria.';

-- ============================================================
-- Seguridad: igual que diagnosticos. RLS activo, cero políticas.
-- Aquí vive el token de la API de Conversiones, así que nadie debe
-- poder leer esta tabla con la anon key.
-- ============================================================
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON configuracion FROM anon, authenticated;
