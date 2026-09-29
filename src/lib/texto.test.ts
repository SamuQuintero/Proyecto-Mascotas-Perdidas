import { describe, expect, it } from "vitest";
import { contieneTexto, normalizarTexto } from "./texto";

describe("normalizarTexto", () => {
  it("ignora mayúsculas, tildes, diéresis, ñ y espacios de más", () => {
    expect(normalizarTexto("  FÁTIMA   Pingüino  Nariño ")).toBe("fatima pinguino narino");
  });
});

describe("contieneTexto", () => {
  it("busca sin distinguir mayúsculas ni tildes", () => {
    expect(contieneTexto("Barrio Fátima", "fatima")).toBe(true);
    expect(contieneTexto("barrio fatima", "FÁTIMA")).toBe(true);
    expect(contieneTexto("Las Cuadras", "fatima")).toBe(false);
  });

  it("una búsqueda vacía coincide con todo", () => {
    expect(contieneTexto("Lo que sea", "   ")).toBe(true);
  });
});
