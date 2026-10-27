import { describe, expect, it } from "vitest";
import {
  calcularIndicadores,
  etiquetaMes,
  formatearDias,
  formatearPorcentaje,
  leerPeriodo,
  type ReporteIndicador,
} from "./indicadores";

const AHORA = new Date("2026-06-15T15:00:00Z");
const hace = (dias: number) => new Date(AHORA.getTime() - dias * 24 * 60 * 60 * 1000);

let contador = 0;
function reporte(parcial: Partial<ReporteIndicador>): ReporteIndicador {
  contador++;
  const creadoEn = parcial.creadoEn ?? hace(5);
  return {
    id: `r${contador}`,
    tipo: "PERDIDA",
    estado: "ACTIVO",
    especie: "Perro",
    color: "Café",
    tamano: "MEDIANO",
    latitud: 1.2136,
    longitud: -77.2811,
    zona: "Centro",
    fecha: creadoEn,
    creadoEn,
    reencontradaEn: null,
    ...parcial,
  };
}

describe("calcularIndicadores (HU-22)", () => {
  it("cuenta pérdidas, hallazgos y reunificaciones por especie", () => {
    const datos = [
      reporte({ especie: "Perro" }),
      reporte({ especie: "Perro", estado: "REENCONTRADA", reencontradaEn: hace(2), creadoEn: hace(4) }),
      reporte({ especie: "Gato" }),
      reporte({ especie: "Gato", tipo: "ENCONTRADA", color: "Negro" }),
      reporte({ especie: "Hámster" }),
    ];
    const r = calcularIndicadores(datos, "todo", AHORA);
    const perro = r.porEspecie.find((e) => e.especie === "Perro")!;
    const gato = r.porEspecie.find((e) => e.especie === "Gato")!;
    const otro = r.porEspecie.find((e) => e.especie === "Otro")!;

    expect(perro).toMatchObject({ perdidas: 2, reunificadas: 1, tasaReunificacion: 0.5 });
    expect(gato).toMatchObject({ perdidas: 1, encontradas: 1, reunificadas: 0, tasaReunificacion: 0 });
    expect(otro.perdidas).toBe(1);
    expect(r.total).toBe(5);
  });

  it("mide la brecha entre perros y gatos en puntos porcentuales", () => {
    const datos = [
      reporte({ especie: "Perro", estado: "REENCONTRADA", reencontradaEn: hace(1) }),
      reporte({ especie: "Perro", estado: "REENCONTRADA", reencontradaEn: hace(1) }),
      reporte({ especie: "Gato", estado: "REENCONTRADA", reencontradaEn: hace(1) }),
      reporte({ especie: "Gato" }),
      reporte({ especie: "Gato" }),
      reporte({ especie: "Gato" }),
    ];
    // Perros 100 %, gatos 25 %.
    expect(calcularIndicadores(datos, "todo", AHORA).brechaPerrosGatos).toBe(75);
  });

  it("no calcula la brecha si no hay pérdidas de alguna de las dos especies", () => {
    expect(calcularIndicadores([reporte({ especie: "Perro" })], "todo", AHORA).brechaPerrosGatos).toBeNull();
  });

  it("promedia los días hasta la reunificación", () => {
    const datos = [
      reporte({ estado: "REENCONTRADA", creadoEn: hace(10), reencontradaEn: hace(8) }),
      reporte({ estado: "REENCONTRADA", creadoEn: hace(10), reencontradaEn: hace(4) }),
    ];
    const perro = calcularIndicadores(datos, "todo", AHORA).porEspecie[0];
    expect(perro.diasPromedioReunificacion).toBeCloseTo(4, 5);
  });

  it("cuenta las pérdidas con una posible coincidencia, aunque el hallazgo sea anterior al periodo", () => {
    const datos = [
      reporte({ especie: "Perro", color: "Café", creadoEn: hace(3) }),
      reporte({ especie: "Perro", color: "Blanco", creadoEn: hace(3) }),
      reporte({ tipo: "ENCONTRADA", especie: "Perro", color: "Marrón", creadoEn: hace(100), fecha: hace(2) }),
    ];
    const perro = calcularIndicadores(datos, "30", AHORA).porEspecie[0];
    expect(perro.perdidas).toBe(2);
    expect(perro.conCoincidencia).toBe(1);
  });

  it("filtra por periodo según la fecha de publicación", () => {
    const datos = [reporte({ creadoEn: hace(5) }), reporte({ creadoEn: hace(60) })];
    expect(calcularIndicadores(datos, "30", AHORA).total).toBe(1);
    expect(calcularIndicadores(datos, "90", AHORA).total).toBe(2);
  });

  it("agrupa zonas sin distinguir mayúsculas ni tildes y ordena por actividad", () => {
    const datos = [
      reporte({ zona: "Fátima" }),
      reporte({ zona: "fatima " }),
      reporte({ zona: "Centro" }),
    ];
    const zonas = calcularIndicadores(datos, "todo", AHORA).porZona;
    expect(zonas[0]).toMatchObject({ zona: "Fátima", perdidas: 2 });
    expect(zonas).toHaveLength(2);
  });

  it("agrupa por mes en orden cronológico", () => {
    const datos = [
      reporte({ creadoEn: new Date("2026-05-10T15:00:00Z") }),
      reporte({ creadoEn: new Date("2026-04-10T15:00:00Z"), especie: "Gato" }),
      reporte({ creadoEn: new Date("2026-05-12T15:00:00Z"), especie: "Gato", estado: "REENCONTRADA" }),
    ];
    const meses = calcularIndicadores(datos, "todo", AHORA).porMes;
    expect(meses.map((m) => m.mes)).toEqual(["2026-04", "2026-05"]);
    expect(meses[1].porEspecie.Gato).toEqual({ perdidas: 1, reunificadas: 1 });
  });

  it("usa el mes de Colombia, no el de UTC", () => {
    // 1 jun 02:00 UTC = 31 may 21:00 en Colombia
    const datos = [reporte({ creadoEn: new Date("2026-06-01T02:00:00Z") })];
    expect(calcularIndicadores(datos, "todo", AHORA).porMes[0].mes).toBe("2026-05");
  });
});

describe("formato de indicadores", () => {
  it("lee el periodo con valor por defecto", () => {
    expect(leerPeriodo("30")).toBe("30");
    expect(leerPeriodo("x")).toBe("90");
    expect(leerPeriodo(undefined)).toBe("90");
  });

  it("formatea porcentajes, días y meses", () => {
    expect(formatearPorcentaje(0.256)).toBe("26 %");
    expect(formatearPorcentaje(null)).toBe("—");
    expect(formatearDias(2.55)).toBe("2,5 días");
    expect(formatearDias(0.4)).toBe("menos de 1 día");
    expect(etiquetaMes("2026-03")).toContain("2026");
  });
});
