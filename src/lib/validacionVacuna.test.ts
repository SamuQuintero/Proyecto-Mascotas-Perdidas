import { describe, expect, it } from "vitest";
import { fechaParaInput } from "./formato";
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

  describe("próxima cita", () => {
    const base = { nombre: "Rabia", fecha: "2026-01-15" };
    const enDias = (n: number) => fechaParaInput(new Date(Date.now() + n * 24 * 60 * 60 * 1000));

    it("es opcional", () => {
      expect(vacunaSchema.safeParse(base).success).toBe(true);
      expect(vacunaSchema.safeParse({ ...base, proximaCita: "" }).success).toBe(true);
    });

    it("acepta hoy y fechas futuras", () => {
      expect(vacunaSchema.safeParse({ ...base, proximaCita: fechaParaInput(new Date()) }).success).toBe(true);
      expect(vacunaSchema.safeParse({ ...base, proximaCita: enDias(30) }).success).toBe(true);
    });

    it("rechaza ayer y cualquier fecha pasada", () => {
      const r = vacunaSchema.safeParse({ ...base, proximaCita: enDias(-1) });
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0].path).toEqual(["proximaCita"]);
      expect(vacunaSchema.safeParse({ ...base, proximaCita: "2020-01-01" }).success).toBe(false);
    });

    it("rechaza una cita absurdamente lejana o con formato inválido", () => {
      expect(vacunaSchema.safeParse({ ...base, proximaCita: "2099-01-01" }).success).toBe(false);
      expect(vacunaSchema.safeParse({ ...base, proximaCita: "mañana" }).success).toBe(false);
    });
  });
});
