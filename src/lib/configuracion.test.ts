import { afterEach, describe, expect, it } from "vitest";
import {
  enmascarar,
  invalidarCacheConfig,
  origenDeClave,
  valorConfig,
  valorDeEntorno,
} from "./configuracion";

/**
 * Sin Supabase configurado (el caso de estos tests), la tabla no existe y
 * todo debe resolverse con las variables de entorno. Es exactamente el
 * comportamiento que mantiene viva la app si la migración 002 no se corrió.
 */

const ORIGINALES = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINALES };
  invalidarCacheConfig();
});

describe("respaldo en variables de entorno", () => {
  it("usa META_PIXEL_ID cuando existe", async () => {
    process.env.META_PIXEL_ID = "111222333";
    expect(valorDeEntorno("meta_pixel_id")).toBe("111222333");
    expect(await valorConfig("meta_pixel_id")).toBe("111222333");
  });

  it("cae a NEXT_PUBLIC_META_PIXEL_ID si no hay la del servidor", async () => {
    delete process.env.META_PIXEL_ID;
    process.env.NEXT_PUBLIC_META_PIXEL_ID = "999888777";
    expect(await valorConfig("meta_pixel_id")).toBe("999888777");
  });

  it("ignora valores en blanco", async () => {
    process.env.META_CAPI_TOKEN = "   ";
    expect(await valorConfig("meta_capi_token")).toBeUndefined();
  });

  it("sin nada configurado devuelve undefined", async () => {
    delete process.env.NEXT_PUBLIC_URL_ASESORIA;
    expect(await valorConfig("url_asesoria")).toBeUndefined();
  });
});

describe("origen de cada ajuste", () => {
  it("marca el entorno cuando el valor viene de ahí", async () => {
    process.env.META_CAPI_TOKEN = "token-de-entorno";
    expect(await origenDeClave("meta_capi_token")).toBe("entorno");
  });

  it("marca sin configurar cuando no hay valor en ningún lado", async () => {
    delete process.env.META_TEST_EVENT_CODE;
    expect(await origenDeClave("meta_test_event_code")).toBe("sin_configurar");
  });
});

describe("enmascarado de secretos", () => {
  it("deja ver solo los últimos 4 caracteres", () => {
    expect(enmascarar("EAAG1234567890abcdef")).toBe("••••••••••••cdef");
  });

  it("oculta del todo los valores muy cortos", () => {
    expect(enmascarar("corto")).toBe("••••");
  });

  it("con valor vacío no muestra nada", () => {
    expect(enmascarar(undefined)).toBe("");
  });
});
