-- ============================================================
-- 003 — Canal de WhatsApp con el bot de GoHighLevel
--
-- La página de resultado ofrece, además de la agenda, una consulta por
-- WhatsApp con un mensaje prellenado que incluye el código del
-- diagnóstico (primeros 8 caracteres del id, en mayúsculas). El bot de
-- GHL manda ese mensaje a /api/ghl/vincular, que busca el diagnóstico
-- por código y escribe el contexto en el contacto.
--
-- Correr en Supabase: SQL Editor → pegar todo → Run. Es idempotente.
-- ============================================================

-- Código corto buscable. PostgREST no puede filtrar por prefijo sobre un
-- uuid, por eso se materializa como texto.
ALTER TABLE diagnosticos
  ADD COLUMN IF NOT EXISTS codigo TEXT
  GENERATED ALWAYS AS (upper(left(id::text, 8))) STORED;

CREATE INDEX IF NOT EXISTS idx_diagnosticos_codigo ON diagnosticos (codigo);

-- Primera vez que la persona escribió por WhatsApp citando su código.
ALTER TABLE diagnosticos
  ADD COLUMN IF NOT EXISTS whatsapp_iniciado_at TIMESTAMPTZ;

COMMENT ON TABLE configuracion IS
  'Ajustes editables desde /admin/configuracion. Claves: meta_pixel_id, meta_capi_token, meta_test_event_code, meta_api_version, url_asesoria, whatsapp_numero.';
