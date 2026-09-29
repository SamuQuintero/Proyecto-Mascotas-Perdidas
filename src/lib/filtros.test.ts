import { describe, expect, it } from "vitest";
import {
  coincideConTexto,
  construirConsulta,
  contarFiltrosActivos,
  leerFiltros,
  urlConFiltros,
} from "./filtros";

describe("leerFiltros — HU-6", () => {
  it("sin parámetros muestra solo casos abiertos y ningún filtro", () => {
    const filtros = leerFiltros({});
    expect(filtros.estado).toBe("ACTIVO");
    expect(contarFiltrosActivos(filtros)).toBe(0);
    expect(construirConsulta(filtros)).toEqual({ estado: "ACTIVO" });
  });

  it("lee zona, especie, color, tamaño y rango de fechas", () => {
    const filtros = leerFiltros({
      zona: "  Chapinero ",
      especie: "Perro",
      color: "café",
      tamano: "MEDIANO",
      desde: "2026-09-01",
      hasta: "2026-09-10",
    });
    expect(filtros).toMatchObject({
      zona: "Chapinero",
      especie: "Perro",
      color: "café",
      tamano: "MEDIANO",
      desde: "2026-09-01",
      hasta: "2026-09-10",
    });
    expect(contarFiltrosActivos(filtros)).toBe(6);
  });

  it("ignora valores que no son válidos", () => {
    const filtros = leerFiltros({
      especie: "Dragón",
      tamano: "ENORME",
      tipo: "OTRO",
      estado: "BORRADO",
      desde: "ayer",
      hasta: "2026-13-45",
    });
    expect(filtros).toEqual({
      tipo: undefined,
      estado: "ACTIVO",
      especie: undefined,
      tamano: undefined,
      zona: undefined,
      color: undefined,
      desde: undefined,
      hasta: undefined,
    });
  });

  it("corrige un rango de fechas invertido", () => {
    const filtros = leerFiltros({ desde: "2026-09-10", hasta: "2026-09-01" });
    expect(filtros.desde).toBe("2026-09-01");
    expect(filtros.hasta).toBe("2026-09-10");
  });

  it("usa el primer valor si un parámetro viene repetido", () => {
    expect(leerFiltros({ zona: ["Norte", "Sur"] }).zona).toBe("Norte");
  });
});

describe("construirConsulta — HU-6", () => {
  it("zona y color no se filtran en la base (se filtran normalizados después)", () => {
    const where = construirConsulta(leerFiltros({ zona: "chapi", color: "NEGRO" }));
    expect(where.zona).toBeUndefined();
    expect(where.color).toBeUndefined();
  });

  it("incluye el día completo de la fecha final del rango", () => {
    const where = construirConsulta(
      leerFiltros({ desde: "2026-09-01", hasta: "2026-09-10" })
    );
    // Días completos en hora de Colombia (UTC-5).
    expect(where.fecha).toEqual({
      gte: new Date("2026-09-01T05:00:00.000Z"),
      lt: new Date("2026-09-11T05:00:00.000Z"),
    });
  });

  it("el estado TODOS no filtra por estado (incluye reencontradas)", () => {
    const where = construirConsulta(leerFiltros({ estado: "TODOS", tipo: "PERDIDA" }));
    expect(where).toEqual({ tipo: "PERDIDA" });
  });

  it("puede listar solo reportes reencontrados (HU-12)", () => {
    const where = construirConsulta(leerFiltros({ estado: "REENCONTRADA" }));
    expect(where.estado).toBe("REENCONTRADA");
  });
});

describe("coincideConTexto — sin importar mayúsculas, tildes ni espacios", () => {
  const reporte = { zona: "Barrio Fátima, cerca a la IGLESIA", color: "Café con blanco" };

  it.each([
    ["fatima"],
    ["FÁTIMA"],
    ["  Fatima  "],
    ["iglesia"],
    ["cerca   a la"],
  ])("la zona coincide buscando %j", (zona) => {
    expect(coincideConTexto(reporte, { zona })).toBe(true);
  });

  it.each([["cafe"], ["CAFÉ"], ["blanco"], ["café con blanco"], ["marrón"], ["chocolate"]])(
    "el color coincide buscando %j (incluye sinónimos)",
    (color) => {
      expect(coincideConTexto(reporte, { color })).toBe(true);
    }
  );

  it("no coincide con otra zona u otro color", () => {
    expect(coincideConTexto(reporte, { zona: "Las Cuadras" })).toBe(false);
    expect(coincideConTexto(reporte, { color: "negro" })).toBe(false);
  });

  it("la ñ se puede escribir con o sin virgulilla", () => {
    expect(coincideConTexto({ zona: "Parque Nariño", color: "Negro" }, { zona: "narino" })).toBe(true);
  });

  it("sin filtros de texto todo coincide", () => {
    expect(coincideConTexto(reporte, {})).toBe(true);
  });
});

describe("urlConFiltros", () => {
  it("conserva los filtros actuales y aplica los cambios", () => {
    const filtros = leerFiltros({ especie: "Gato", zona: "Norte" });
    const url = new URL(urlConFiltros(filtros, { tipo: "ENCONTRADA" }), "http://x");
    expect(url.pathname).toBe("/reportes");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      especie: "Gato",
      zona: "Norte",
      tipo: "ENCONTRADA",
    });
  });

  it("elimina un filtro al pasar undefined y omite el estado por defecto", () => {
    const filtros = leerFiltros({ especie: "Gato" });
    expect(urlConFiltros(filtros, { especie: undefined })).toBe("/reportes");
  });
});
