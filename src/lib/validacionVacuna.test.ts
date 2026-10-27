import { describe, expect, it } from "vitest";
import { vacunaSchema } from "./validacionVacuna";

describe("vacunaSchema — HU-17 (carnet de vacunas)", () => {
  it("acepta una vacuna con nombre y fecha válidos", () => {
    expect(vacunaSchema.safeParse({ nombre: "Rabia", fecha: "2026-01-15" }).success).toBe(true);
  });

  it("exige el nombre de la vacuna", () => {
    expect(vacunaSchema.safeParse({ nombre: "  ", fecha: "2026-01-15" }).success).toBe(false);
  });

  it("rechaza una fecha futura", () => {
    expect(vacunaSchema.safeParse({ nombre: "Rabia", fecha: "2099-01-01" }).success).toBe(false);
  });

  it("rechaza una fecha con formato inválido", () => {
    expect(vacunaSchema.safeParse({ nombre: "Rabia", fecha: "15/01/2026" }).success).toBe(false);
  });
});
