import { describe, expect, it } from "vitest";
import {
  RADIO_CERCANIA_KM,
  calcularAlertas,
  compararReportes,
  distanciaKm,
  familiasDeColor,
  formatearDistancia,
  type ReporteComparable,
} from "./coincidencias";

// Centro de Pasto y puntos a distancias conocidas (1° de latitud ≈ 111 km).
const PASTO = { latitud: 1.2136, longitud: -77.2811 };
const aKm = (km: number) => ({ latitud: PASTO.latitud + km / 111.2, longitud: PASTO.longitud });

const perdida: ReporteComparable = {
  id: "perdida",
  tipo: "PERDIDA",
  especie: "Perro",
  color: "Café con blanco",
  tamano: "MEDIANO",
  fecha: "2026-09-10T15:00:00-05:00",
  ...PASTO,
};

function hallazgo(cambios: Partial<ReporteComparable> = {}): ReporteComparable {
  return {
    id: "hallazgo",
    tipo: "ENCONTRADA",
    especie: "Perro",
    color: "Marrón y blanco",
    tamano: "MEDIANO",
    fecha: "2026-09-11T09:00:00-05:00",
    ...aKm(0.5),
    ...cambios,
  };
}

describe("distanciaKm", () => {
  it("calcula distancias reales en kilómetros", () => {
    expect(distanciaKm(PASTO, PASTO)).toBe(0);
    expect(distanciaKm(PASTO, aKm(1))).toBeCloseTo(1, 1);
    // Pasto → Ipiales, unos 72 km en línea recta.
    expect(distanciaKm(PASTO, { latitud: 0.8303, longitud: -77.6444 })).toBeGreaterThan(55);
  });
});

describe("familiasDeColor", () => {
  it("agrupa sinónimos, plurales y tildes", () => {
    expect(familiasDeColor("Café con blanco")).toEqual(new Set(["cafe", "blanco"]));
    expect(familiasDeColor("marrón y BLANCA")).toEqual(new Set(["cafe", "blanco"]));
    expect(familiasDeColor("Atigrado gris")).toEqual(new Set(["atigrado", "gris"]));
    expect(familiasDeColor("Amarillo / crema")).toEqual(new Set(["dorado"]));
  });
});

describe("compararReportes — HU-4 coincidencias", () => {
  it("un hallazgo con la misma especie, color y tamaño es una coincidencia", () => {
    const alerta = compararReportes(perdida, hallazgo());
    expect(alerta?.esCoincidencia).toBe(true);
    expect(alerta?.puntaje).toBeGreaterThanOrEqual(80);
    expect(alerta?.razones).toContain("Mismo tamaño");
  });

  it("no compara con otra especie", () => {
    expect(compararReportes(perdida, hallazgo({ especie: "Gato" }))).toBeNull();
  });

  it("sin color en común no es coincidencia (aunque coincidan especie y tamaño)", () => {
    const alerta = compararReportes(perdida, hallazgo({ color: "Negro", ...aKm(8) }));
    expect(alerta).toBeNull();
  });

  it("descarta hallazgos anteriores a la pérdida (más de un día antes)", () => {
    expect(
      compararReportes(perdida, hallazgo({ fecha: "2026-09-01T10:00:00-05:00" }))
    ).toBeNull();
  });

  it("no compara reportes del mismo tipo ni un reporte consigo mismo", () => {
    expect(compararReportes(perdida, { ...perdida, id: "otra" })).toBeNull();
    expect(compararReportes(perdida, { ...hallazgo(), id: "perdida" })).toBeNull();
  });

  it("funciona al revés: un hallazgo encuentra la pérdida parecida", () => {
    const alerta = compararReportes(hallazgo(), perdida);
    expect(alerta?.esCoincidencia).toBe(true);
    expect(alerta?.reporte.id).toBe("perdida");
  });
});

describe("compararReportes — HU-7 hallazgos cercanos", () => {
  it(`un hallazgo a menos de ${RADIO_CERCANIA_KM} km es cercano aunque no se parezca`, () => {
    const alerta = compararReportes(perdida, hallazgo({ color: "Negro", ...aKm(1.5) }));
    expect(alerta?.esCercano).toBe(true);
    expect(alerta?.esCoincidencia).toBe(false);
    expect(alerta?.razones.some((r) => r.includes("donde se perdió"))).toBe(true);
  });

  it(`a más de ${RADIO_CERCANIA_KM} km no es cercano`, () => {
    const alerta = compararReportes(perdida, hallazgo({ ...aKm(5) }));
    expect(alerta?.esCercano).toBe(false);
    expect(alerta?.esCoincidencia).toBe(true);
  });

  it("marca el mismo lugar", () => {
    const alerta = compararReportes(perdida, hallazgo({ ...PASTO }));
    expect(alerta?.razones).toContain("En el mismo lugar");
  });
});

describe("calcularAlertas", () => {
  it("ordena primero las coincidencias más parecidas y luego los cercanos", () => {
    const alertas = calcularAlertas(perdida, [
      hallazgo({ id: "cerca-distinto", color: "Negro", ...aKm(0.3) }),
      hallazgo({ id: "parecido-lejos", ...aKm(6), tamano: "GRANDE" }),
      hallazgo({ id: "identico", ...aKm(0.2) }),
      hallazgo({ id: "gato", especie: "Gato" }),
    ]);
    expect(alertas.map((a) => a.reporte.id)).toEqual([
      "identico",
      "parecido-lejos",
      "cerca-distinto",
    ]);
  });
});

describe("formatearDistancia", () => {
  it("usa metros por debajo de 1 km y kilómetros con coma decimal", () => {
    expect(formatearDistancia(0.456)).toBe("460 m");
    expect(formatearDistancia(1.25)).toBe("1,3 km");
  });
});
