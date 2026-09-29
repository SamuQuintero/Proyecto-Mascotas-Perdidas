import { describe, expect, it } from "vitest";
import {
  fechaParaInput,
  formatearFecha,
  formatearHora,
  horaParaInput,
  instanteColombia,
} from "./formato";

describe("fecha y hora en hora de Colombia", () => {
  it("convierte la fecha y hora del formulario al instante correcto (UTC-5)", () => {
    expect(instanteColombia("2026-09-08", "15:30").toISOString()).toBe(
      "2026-09-08T20:30:00.000Z"
    );
  });

  it("de ida y vuelta: lo que se guarda vuelve a los mismos valores del formulario", () => {
    const instante = instanteColombia("2026-09-08", "23:45");
    expect(fechaParaInput(instante)).toBe("2026-09-08");
    expect(horaParaInput(instante)).toBe("23:45");
  });

  it("muestra la hora en formato de 12 horas", () => {
    expect(formatearHora(instanteColombia("2026-09-08", "15:30"))).toMatch(/3:30\s?p/);
  });

  it("una fecha sin hora no se muestra un día antes", () => {
    expect(formatearFecha("2026-09-08", "larga")).toContain("8 de septiembre");
  });
});
