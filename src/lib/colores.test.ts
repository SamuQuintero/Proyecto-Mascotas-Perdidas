import { describe, expect, it } from "vitest";
import { aplicarColor, canonizarColor, colorCompleto, sugerirColores } from "./colores";

const nombres = (texto: string) => sugerirColores(texto).map((c) => c.nombre);

describe("sugerirColores — autocompletado de color", () => {
  it("sin nada escrito muestra los colores principales", () => {
    expect(nombres("")).toEqual(["Negro", "Blanco", "Gris", "Plateado", "Café", "Marrón", "Chocolate", "Canela"]);
  });

  it("filtra mientras se escribe, sin importar mayúsculas ni tildes", () => {
    expect(nombres("caf")).toEqual(["Café"]);
    expect(nombres("CAFE")).toEqual(["Café"]);
    expect(nombres("marron")).toEqual(["Marrón"]);
    expect(nombres("  b")).toEqual(["Blanco", "Beige", "Bicolor"]);
  });

  it("primero los que empiezan igual y luego los que contienen el texto", () => {
    expect(nombres("do")).toEqual(["Dorado", "Plateado", "Atigrado", "Manchado"]);
    expect(nombres("ro")[0]).toBe("Rojizo");
  });

  it("sugiere para la palabra que se está escribiendo al combinar colores", () => {
    expect(nombres("Café con bl")).toEqual(["Blanco"]);
    expect(nombres("Negro y gr")[0]).toBe("Gris");
    expect(nombres("Blanco, ne")[0]).toBe("Negro");
  });

  it("no vuelve a sugerir un color ya escrito", () => {
    expect(nombres("Café con ")).not.toContain("Café");
  });

  it("no sugiere nada si no hay coincidencias", () => {
    expect(nombres("fucsia")).toEqual([]);
  });
});

describe("aplicarColor", () => {
  it("completa el primer color con mayúscula inicial", () => {
    expect(aplicarColor("caf", "Café")).toBe("Café");
  });

  it("completa el segundo color en minúscula conservando lo anterior", () => {
    expect(aplicarColor("Café con bl", "Blanco")).toBe("Café con blanco");
    expect(aplicarColor("Negro, gr", "Gris")).toBe("Negro, gris");
  });
});

describe("colorCompleto", () => {
  it("solo está completo cuando se escribió exactamente como en la lista", () => {
    expect(colorCompleto("Café")).toBe(true);
    expect(colorCompleto("Café con blanco")).toBe(true);
    expect(colorCompleto("CAFE")).toBe(false);
    expect(colorCompleto("Café con bla")).toBe(false);
  });

  it("escribir un color completo en otra forma sigue ofreciendo la opción correcta", () => {
    expect(nombres("CAFE")).toEqual(["Café"]);
  });
});

describe("canonizarColor", () => {
  it("corrige mayúsculas y tildes de los colores conocidos", () => {
    expect(canonizarColor("CAFE con BLANCO")).toBe("Café con blanco");
    expect(canonizarColor("  negro Y  gris ")).toBe("Negro y gris");
    expect(canonizarColor("marron,crema")).toBe("Marrón, crema");
  });

  it("deja igual lo que no es un color de la lista", () => {
    expect(canonizarColor("Café con manchas blancas")).toBe("Café con manchas blancas");
  });
});
