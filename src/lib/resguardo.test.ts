import { describe, expect, it } from "vitest";
import { animalResguardoSchema, diasEnResguardo, textoResguardo } from "./resguardo";

const valido = {
  especie: "Perro",
  color: "Café",
  tamano: "MEDIANO",
  desde: "2026-01-10",
};

describe("animalResguardoSchema (HU-20)", () => {
  it("acepta los datos mínimos", () => {
    expect(animalResguardoSchema.safeParse(valido).success).toBe(true);
  });

  it("exige especie, color, tamaño y desde cuándo", () => {
    const r = animalResguardoSchema.safeParse({});
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual([
        "color",
        "desde",
        "especie",
        "tamano",
      ]);
    }
  });

  it("rechaza una fecha de ingreso futura", () => {
    expect(animalResguardoSchema.safeParse({ ...valido, desde: "2999-01-01" }).success).toBe(false);
  });
});

describe("tiempo en resguardo", () => {
  // 12:00 en Colombia = 17:00 UTC
  const ahora = new Date("2026-03-15T17:00:00Z");

  it("cuenta días completos en hora de Colombia", () => {
    expect(diasEnResguardo("2026-03-15", ahora)).toBe(0);
    expect(diasEnResguardo("2026-03-14", ahora)).toBe(1);
    expect(diasEnResguardo("2026-03-03", ahora)).toBe(12);
  });

  it("no cuenta el cambio de día en UTC: a las 8 p. m. en Colombia sigue siendo el mismo día", () => {
    // 20:00 Colombia del 14 = 01:00 UTC del 15
    expect(diasEnResguardo("2026-03-14", new Date("2026-03-15T01:00:00Z"))).toBe(0);
  });

  it("redacta el texto con la fecha y el tiempo", () => {
    expect(textoResguardo("2026-03-14", ahora)).toContain("hace 1 día");
    expect(textoResguardo("2026-03-15", ahora)).toContain("llegó hoy");
    expect(textoResguardo("2026-03-03", ahora)).toContain("hace 12 días");
  });
});
