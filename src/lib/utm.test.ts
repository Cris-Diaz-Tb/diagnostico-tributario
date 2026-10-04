import { describe, expect, it } from "vitest";
import { resolverAtribucion, type DatosUtm } from "./utm";

const AHORA = 1_790_000_000_000;
const DIA = 86_400_000;
const ctx = (ahora = AHORA) => ({ referrer: "https://l.instagram.com/", path: "/diagnostico", ahora });

const anuncio = resolverAtribucion(
  new URLSearchParams("utm_source=ig&utm_medium=paid&utm_campaign=oct&utm_content=AD1&utm_term=instagram_stories&fbclid=abc"),
  null,
  ctx()
);

describe("atribución de la sesión", () => {
  it("captura todos los parámetros al aterrizar, también directo en /diagnostico", () => {
    expect(anuncio).toMatchObject({
      source: "ig",
      content: "AD1",
      term: "instagram_stories",
      landingPath: "/diagnostico",
      fbclid: "abc",
      fbclidAt: AHORA,
    });
  });

  it("una página sin UTMs conserva la campaña dentro de la ventana", () => {
    const despues = resolverAtribucion(new URLSearchParams(""), anuncio, ctx(AHORA + 3 * DIA));
    expect(despues).toEqual(anuncio);
  });

  it("vencida la ventana, una visita sin UTMs queda como directa", () => {
    const despues = resolverAtribucion(new URLSearchParams(""), anuncio, ctx(AHORA + 8 * DIA));
    expect(despues.source).toBeNull();
    expect(despues.content).toBeNull();
  });

  it("una campaña nueva reemplaza el set completo, sin mezclar campos", () => {
    const nueva = resolverAtribucion(new URLSearchParams("utm_source=fb"), anuncio, ctx(AHORA + DIA));
    expect(nueva.source).toBe("fb");
    expect(nueva.content).toBeNull();
    expect(nueva.fbclid).toBeNull();
  });

  it("respeta lo guardado antes de existir capturadoAt", () => {
    const antiguo: DatosUtm = { ...anuncio, capturadoAt: undefined };
    expect(resolverAtribucion(new URLSearchParams(""), antiguo, ctx()).source).toBe("ig");
  });
});
