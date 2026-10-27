import { describe, expect, it } from "vitest";
import { puedeGestionar } from "./propiedad";
import {
  diasSinRenovar,
  fueRenovado,
  necesitaRecordatorio,
  puedeRenovar,
} from "./renovacion";

const AHORA = new Date("2026-03-20T12:00:00Z");
const haceDias = (n: number) => new Date(AHORA.getTime() - n * 24 * 60 * 60 * 1000);

describe("recordatorio de renovación (HU-19)", () => {
  it("cuenta días completos desde la última difusión", () => {
    expect(diasSinRenovar(haceDias(3), AHORA)).toBe(3);
    expect(diasSinRenovar(new Date(AHORA.getTime() + 1000), AHORA)).toBe(0);
  });

  it("pide confirmar a los 7 días en una pérdida abierta", () => {
    const base = { tipo: "PERDIDA", estado: "ACTIVO" } as const;
    expect(necesitaRecordatorio({ ...base, renovadoEn: haceDias(6) }, AHORA)).toBe(false);
    expect(necesitaRecordatorio({ ...base, renovadoEn: haceDias(7) }, AHORA)).toBe(true);
  });

  it("no pide confirmar hallazgos ni casos ya reencontrados", () => {
    expect(
      necesitaRecordatorio({ tipo: "ENCONTRADA", estado: "ACTIVO", renovadoEn: haceDias(30) }, AHORA)
    ).toBe(false);
    expect(
      necesitaRecordatorio({ tipo: "PERDIDA", estado: "REENCONTRADA", renovadoEn: haceDias(30) }, AHORA)
    ).toBe(false);
  });

  it("solo deja renovar casos abiertos y no más de una vez al día", () => {
    const abierto = { tipo: "PERDIDA", estado: "ACTIVO" } as const;
    expect(puedeRenovar({ ...abierto, renovadoEn: new Date(AHORA.getTime() - 3600_000) }, AHORA)).toBe(false);
    expect(puedeRenovar({ ...abierto, renovadoEn: haceDias(1) }, AHORA)).toBe(true);
    expect(
      puedeRenovar({ tipo: "PERDIDA", estado: "REENCONTRADA", renovadoEn: haceDias(10) }, AHORA)
    ).toBe(false);
  });

  it("distingue un reporte renovado", () => {
    expect(fueRenovado({ renovaciones: 0 })).toBe(false);
    expect(fueRenovado({ renovaciones: 2 })).toBe(true);
  });
});

describe("puedeGestionar (HU-19 / HU-23)", () => {
  it("el admin gestiona cualquier recurso", () => {
    expect(puedeGestionar({ usuarioId: null }, { usuarioId: null, esAdmin: true })).toBe(true);
    expect(puedeGestionar({ usuarioId: "a" }, { usuarioId: null, esAdmin: true })).toBe(true);
  });

  it("el dueño gestiona lo suyo y nadie más", () => {
    expect(puedeGestionar({ usuarioId: "a" }, { usuarioId: "a", esAdmin: false })).toBe(true);
    expect(puedeGestionar({ usuarioId: "a" }, { usuarioId: "b", esAdmin: false })).toBe(false);
  });

  it("un recurso sin dueño no lo gestiona un visitante sin sesión", () => {
    expect(puedeGestionar({ usuarioId: null }, { usuarioId: null, esAdmin: false })).toBe(false);
  });
});
