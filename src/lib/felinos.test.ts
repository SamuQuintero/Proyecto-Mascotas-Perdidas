import { describe, expect, it } from "vitest";
import {
  calcularAlertas,
  compararMascotaConReporte,
  compararReportes,
  type ReporteComparable,
} from "./coincidencias";
import { ajusteFelino, resumenSenasFelinas, senasFelinasParaGuardar } from "./felinos";

const gato = { especie: "Gato" };

describe("ajusteFelino (HU-24)", () => {
  it("suma cuando las señas registradas coinciden", () => {
    const r = ajusteFelino(
      { ...gato, patronPelaje: "Atigrado", colorOjos: "Verde" },
      { ...gato, patronPelaje: "atigrado", colorOjos: "Verde" }
    );
    expect(r.puntos).toBe(16);
    expect(r.razones).toEqual(["Mismo patrón de pelaje (atigrado)", "Mismo color de ojos (verde)"]);
  });

  it("resta cuando se contradicen", () => {
    expect(
      ajusteFelino({ ...gato, patronPelaje: "Atigrado" }, { ...gato, patronPelaje: "Sólido" }).puntos
    ).toBe(-20);
  });

  it("ignora las señas que falta registrar en alguno de los dos lados", () => {
    expect(
      ajusteFelino({ ...gato, patronPelaje: "Atigrado" }, { ...gato, largoPelaje: "Largo" })
    ).toEqual({ puntos: 0, razones: [] });
  });

  it("no aplica si alguno no es gato", () => {
    expect(
      ajusteFelino({ especie: "Perro", patronPelaje: "Atigrado" }, { ...gato, patronPelaje: "Atigrado" })
        .puntos
    ).toBe(0);
  });
});

describe("señas felinas al guardar y mostrar", () => {
  it("solo se guardan para gatos", () => {
    const datos = { patronPelaje: "Bicolor", largoPelaje: "Corto", colorOjos: "Azul", esDeInterior: "SI" };
    expect(senasFelinasParaGuardar({ especie: "Gato", ...datos })).toEqual({
      patronPelaje: "Bicolor",
      largoPelaje: "Corto",
      colorOjos: "Azul",
      esDeInterior: true,
    });
    expect(senasFelinasParaGuardar({ especie: "Perro", ...datos })).toEqual({
      patronPelaje: null,
      largoPelaje: null,
      colorOjos: null,
      esDeInterior: null,
    });
  });

  it("convierte vacío y 'no sé' en nulo", () => {
    const r = senasFelinasParaGuardar({ especie: "Gato", patronPelaje: "", esDeInterior: "NO_SE" });
    expect(r.patronPelaje).toBeNull();
    expect(r.esDeInterior).toBeNull();
    expect(senasFelinasParaGuardar({ especie: "Gato", esDeInterior: "NO" }).esDeInterior).toBe(false);
  });

  it("resume solo las señas registradas", () => {
    expect(resumenSenasFelinas({ ...gato, colorOjos: "Verde", esDeInterior: true })).toEqual([
      ["Color de ojos", "Verde"],
      ["Vive en", "Interior"],
    ]);
    expect(resumenSenasFelinas({ especie: "Perro", colorOjos: "Verde" })).toEqual([]);
  });
});

function reporte(parcial: Partial<ReporteComparable> & { id: string }): ReporteComparable {
  return {
    tipo: "PERDIDA",
    especie: "Gato",
    color: "Gris",
    tamano: "PEQUENO",
    latitud: 1.2136,
    longitud: -77.2811,
    fecha: new Date("2026-03-10T15:00:00Z"),
    ...parcial,
  };
}

describe("coincidencia de gatos con señas propias (HU-24)", () => {
  const perdida = reporte({ id: "p", patronPelaje: "Atigrado", colorOjos: "Verde" });

  it("sube el puntaje y explica la razón si las señas coinciden", () => {
    const conSenas = compararReportes(
      perdida,
      reporte({ id: "h1", tipo: "ENCONTRADA", patronPelaje: "Atigrado", colorOjos: "Verde" })
    )!;
    expect(conSenas.puntaje).toBe(100);
    expect(conSenas.razones.join(" ")).toContain("Mismo patrón de pelaje");
  });

  it("rescata una coincidencia que sin las señas no llegaría al mínimo", () => {
    // Color en común a medias, tamaño distinto y lejos: 30 + 18 + 0 + 0 = 48 (no alcanza 60).
    const lejos = { latitud: 1.5, longitud: -77.5, tamano: "GRANDE" as const, color: "Gris con blanco" };
    const base = reporte({ id: "p2", color: "Gris con negro" });
    const sin = compararReportes(base, reporte({ id: "h2", tipo: "ENCONTRADA", ...lejos }));
    expect(sin?.esCoincidencia ?? false).toBe(false);

    const conSenas = compararReportes(
      { ...base, patronPelaje: "Atigrado", colorOjos: "Verde", largoPelaje: "Corto" },
      reporte({
        id: "h3",
        tipo: "ENCONTRADA",
        ...lejos,
        patronPelaje: "Atigrado",
        colorOjos: "Verde",
        largoPelaje: "Corto",
      })
    );
    expect(conSenas?.esCoincidencia).toBe(true);
  });

  it("descarta como coincidencia a un gato con patrón y ojos distintos", () => {
    const alerta = compararReportes(
      perdida,
      reporte({ id: "h4", tipo: "ENCONTRADA", patronPelaje: "Sólido", colorOjos: "Azul", tamano: "MEDIANO" })
    );
    // 30 + 35 + 5 + 15 − 20 − 15 = 50 < 60
    expect(alerta?.esCoincidencia ?? false).toBe(false);
  });

  it("calcularAlertas prioriza al gato cuyas señas coinciden", () => {
    const hallazgos = [
      reporte({ id: "otro", tipo: "ENCONTRADA", patronPelaje: "Sólido" }),
      reporte({ id: "este", tipo: "ENCONTRADA", patronPelaje: "Atigrado" }),
    ];
    expect(calcularAlertas(perdida, hallazgos)[0].reporte.id).toBe("este");
  });

  it("también afina la alerta de una mascota con perfil QR (HU-10)", () => {
    const mascota = { id: "m", especie: "Gato", color: "Gris", tamano: "PEQUENO" as const, colorOjos: "Verde" };
    const igualOjos = compararMascotaConReporte(
      mascota,
      reporte({ id: "h5", tipo: "ENCONTRADA", colorOjos: "Verde" })
    )!;
    const otrosOjos = compararMascotaConReporte(
      mascota,
      reporte({ id: "h6", tipo: "ENCONTRADA", colorOjos: "Azul" })
    );
    expect(igualOjos.puntaje).toBe(100);
    expect(otrosOjos === null || otrosOjos.puntaje < igualOjos.puntaje).toBe(true);
  });
});
