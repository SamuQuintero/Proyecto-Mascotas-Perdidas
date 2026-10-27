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

import { puedeCambiarEstado } from "./propiedad";
import { calcularAlertasResguardo, type ReporteComparable } from "./coincidencias";

describe("puedeCambiarEstado (cierre por el dueño)", () => {
  const dueno = { usuarioId: "a", esAdmin: false };
  it("el dueño puede cerrar su caso pero no reabrirlo", () => {
    expect(puedeCambiarEstado({ usuarioId: "a" }, dueno, "REENCONTRADA")).toBe(true);
    expect(puedeCambiarEstado({ usuarioId: "a" }, dueno, "ACTIVO")).toBe(false);
  });
  it("otro usuario o sin sesión no puede cerrar", () => {
    expect(puedeCambiarEstado({ usuarioId: "b" }, dueno, "REENCONTRADA")).toBe(false);
    expect(puedeCambiarEstado({ usuarioId: "a" }, { usuarioId: null, esAdmin: false }, "REENCONTRADA")).toBe(false);
  });
  it("el admin puede todo", () => {
    expect(puedeCambiarEstado({ usuarioId: null }, { usuarioId: null, esAdmin: true }, "ACTIVO")).toBe(true);
  });
});

describe("animales en resguardo vs pérdidas (HU-20)", () => {
  const perdida: ReporteComparable = {
    id: "p", tipo: "PERDIDA", especie: "Perro", color: "Café", tamano: "MEDIANO",
    latitud: 1.2, longitud: -77.3, fecha: new Date("2026-03-10T15:00:00Z"),
  };
  const animal = (parcial = {}) => ({
    id: "a", especie: "Perro", color: "Marrón", tamano: "MEDIANO" as const,
    desde: new Date("2026-03-12T05:00:00Z"), ...parcial,
  });

  it("alerta si coinciden especie, color y tamaño", () => {
    const [a] = calcularAlertasResguardo(perdida, [animal()]);
    expect(a.puntaje).toBe(100);
  });
  it("descarta color distinto, especie distinta o ingreso anterior a la pérdida", () => {
    expect(calcularAlertasResguardo(perdida, [animal({ color: "Blanco" })])).toHaveLength(0);
    expect(calcularAlertasResguardo(perdida, [animal({ especie: "Gato" })])).toHaveLength(0);
    expect(calcularAlertasResguardo(perdida, [animal({ desde: new Date("2026-03-01T05:00:00Z") })])).toHaveLength(0);
  });
  it("no compara contra hallazgos", () => {
    expect(calcularAlertasResguardo({ ...perdida, tipo: "ENCONTRADA" }, [animal()])).toHaveLength(0);
  });
});
