import { describe, expect, it } from "vitest";
import { diaChile, fechaHoraChile, inicioDelDiaChile } from "./hora-chile";

describe("hora de Chile", () => {
  it("convierte UTC a hora de verano (UTC-3)", () => {
    expect(fechaHoraChile("2026-10-05T13:30:00Z")).toBe("2026-10-05 10:30");
  });

  it("convierte UTC a hora de invierno (UTC-4)", () => {
    expect(fechaHoraChile("2026-07-01T13:30:00Z")).toBe("2026-07-01 09:30");
  });

  it("de noche en Chile sigue siendo el mismo día aunque en UTC ya sea mañana", () => {
    expect(diaChile("2026-10-06T01:00:00Z")).toBe("2026-10-05");
  });

  it("el día en Chile empieza a medianoche local", () => {
    expect(inicioDelDiaChile("2026-10-05")).toBe("2026-10-05T03:00:00.000Z");
    expect(inicioDelDiaChile("2026-07-01")).toBe("2026-07-01T04:00:00.000Z");
  });
});
