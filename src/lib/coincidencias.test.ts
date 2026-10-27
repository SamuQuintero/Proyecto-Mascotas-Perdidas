import { describe, expect, it } from "vitest";
import {
  RADIO_CERCANIA_KM,
  RADIO_DUPLICADO_KM,
  calcularAlertas,
  calcularAlertasMascota,
  calcularDuplicados,
  compararDuplicados,
  compararMascotaConReporte,
  compararReportes,
  distanciaKm,
  familiasDeColor,
  formatearDistancia,
  type MascotaComparable,
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

describe("compararDuplicados — HU-15", () => {
  const original: ReporteComparable = {
    id: "original",
    tipo: "PERDIDA",
    especie: "Perro",
    color: "Café con blanco",
    tamano: "MEDIANO",
    fecha: "2026-09-10T15:00:00-05:00",
    ...PASTO,
  };

  function otraPublicacion(cambios: Partial<ReporteComparable> = {}): ReporteComparable {
    return {
      id: "otra",
      tipo: "PERDIDA",
      especie: "Perro",
      color: "Marrón",
      tamano: "GRANDE", // el tamaño no decide duplicado, solo especie/color/distancia/fecha
      fecha: "2026-09-11T09:00:00-05:00",
      ...aKm(0.3),
      ...cambios,
    };
  }

  it("detecta una publicación repetida: mismo tipo, color parecido, cerca y en pocos días", () => {
    const resultado = compararDuplicados(original, otraPublicacion());
    expect(resultado).not.toBeNull();
    expect(resultado?.razones.some((r) => r.includes("especie"))).toBe(true);
  });

  it("no compara reportes de distinto tipo (eso es HU-4, no HU-15)", () => {
    expect(compararDuplicados(original, otraPublicacion({ tipo: "ENCONTRADA" }))).toBeNull();
  });

  it(`a más de ${RADIO_DUPLICADO_KM} km no se considera duplicado`, () => {
    expect(compararDuplicados(original, otraPublicacion({ ...aKm(3) }))).toBeNull();
  });

  it("sin color en común no se considera duplicado", () => {
    expect(compararDuplicados(original, otraPublicacion({ color: "Negro" }))).toBeNull();
  });

  it("con más de 5 días de diferencia no se considera duplicado", () => {
    expect(
      compararDuplicados(original, otraPublicacion({ fecha: "2026-09-20T09:00:00-05:00" }))
    ).toBeNull();
  });

  it("calcularDuplicados ordena por cercanía y descarta al propio reporte", () => {
    const resultado = calcularDuplicados(original, [
      otraPublicacion({ id: "lejos", ...aKm(0.8) }),
      original, // no debe compararse consigo mismo
      otraPublicacion({ id: "cerca", ...aKm(0.1) }),
    ]);
    expect(resultado.map((d) => d.reporte.id)).toEqual(["cerca", "lejos"]);
  });
});

describe("compararMascotaConReporte — HU-10 (alerta por características a una mascota con perfil QR)", () => {
  const miMascota: MascotaComparable = {
    id: "mascota-1",
    especie: "Perro",
    color: "Café con blanco",
    tamano: "MEDIANO",
  };

  function hallazgoParecido(cambios: Partial<ReporteComparable> = {}): ReporteComparable {
    return {
      id: "hallazgo",
      tipo: "ENCONTRADA",
      especie: "Perro",
      color: "Marrón y blanco",
      tamano: "MEDIANO",
      fecha: "2026-09-11T09:00:00-05:00",
      ...aKm(2),
      ...cambios,
    };
  }

  it("alerta cuando un hallazgo coincide en especie, color y tamaño", () => {
    const alerta = compararMascotaConReporte(miMascota, hallazgoParecido());
    expect(alerta).not.toBeNull();
    expect(alerta?.puntaje).toBeGreaterThanOrEqual(80);
    expect(alerta?.razones.some((r) => r.includes("especie"))).toBe(true);
  });

  it("no alerta con un reporte de tipo PERDIDA (solo interesan los hallazgos)", () => {
    expect(compararMascotaConReporte(miMascota, hallazgoParecido({ tipo: "PERDIDA" }))).toBeNull();
  });

  it("no alerta con otra especie", () => {
    expect(compararMascotaConReporte(miMascota, hallazgoParecido({ especie: "Gato" }))).toBeNull();
  });

  it("no alerta sin un color en común", () => {
    expect(compararMascotaConReporte(miMascota, hallazgoParecido({ color: "Negro" }))).toBeNull();
  });

  it("no depende de la distancia (la mascota no tiene ubicación propia)", () => {
    const lejos = compararMascotaConReporte(miMascota, hallazgoParecido({ ...aKm(80) }));
    expect(lejos).not.toBeNull();
  });

  it("calcularAlertasMascota ordena por puntaje y descarta los que no coinciden", () => {
    const resultado = calcularAlertasMascota(miMascota, [
      hallazgoParecido({ id: "parecido-pero-grande", tamano: "GRANDE" }),
      hallazgoParecido({ id: "identico" }),
      hallazgoParecido({ id: "gato", especie: "Gato" }),
    ]);
    expect(resultado.map((a) => a.reporte.id)).toEqual(["identico", "parecido-pero-grande"]);
  });
});
