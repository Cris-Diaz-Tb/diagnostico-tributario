/**
 * Sustituto de `server-only` para los tests.
 *
 * El paquete real lanza un error a propósito si alguien lo importa fuera
 * del servidor — es lo que protege de filtrar la service role key al
 * cliente. En vitest no hay servidor de Next, así que se reemplaza por
 * este módulo vacío (ver el alias en vitest.config.ts).
 */
export {};
