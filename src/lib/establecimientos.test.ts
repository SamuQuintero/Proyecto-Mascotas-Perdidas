import { describe, expect, it } from "vitest";
import { enlaceComoLlegar, ordenarPorCercania, type Establecimiento } from "./establecimientos";

const PLAZA = { latitud: 1.2136, longitud: -77.2811 };

function est(
  id: string,
  tipo: Establecimiento["tipo"],
  latitud: number,
  longitud: number
): Establecimiento {
  return { id, tipo, nombre: id, telefono: "3001234567", direccion: null, latitud, longitud };
}

describe("ordenarPorCercania (HU-18)", () => {
  const lista = [
    est("lejos", "REFUGIO", 1.3, -77.3),
    est("cerca", "VETERINARIA", 1.214, -77.2815),
    est("medio", "REFUGIO", 1.23, -77.28),
  ];

  it("ordena del más cercano al más lejano e incluye la distancia", () => {
    const orden = ordenarPorCercania(lista, PLAZA);
    expect(orden.map((e) => e.id)).toEqual(["cerca", "medio", "lejos"]);
    expect(orden[0].distanciaKm).toBeLessThan(0.1);
    expect(orden[2].distanciaKm).toBeGreaterThan(orden[1].distanciaKm);
  });

  it("filtra por tipo", () => {
    expect(ordenarPorCercania(lista, PLAZA, "REFUGIO").map((e) => e.id)).toEqual([
      "medio",
      "lejos",
    ]);
    expect(ordenarPorCercania(lista, PLAZA, "VETERINARIA").map((e) => e.id)).toEqual(["cerca"]);
  });

  it("no modifica la lista original", () => {
    ordenarPorCercania(lista, PLAZA);
    expect(lista[0].id).toBe("lejos");
  });
});

describe("enlaceComoLlegar", () => {
  it("apunta a las coordenadas del local", () => {
    expect(enlaceComoLlegar({ latitud: 1.2, longitud: -77.3 })).toContain("destination=1.2,-77.3");
  });
});
