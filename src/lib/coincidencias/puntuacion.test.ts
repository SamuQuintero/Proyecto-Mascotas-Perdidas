import { describe, expect, it } from "vitest";
import { criterioColor, criterioEspecie, criterioTamano } from "./criterios";
import type { PerfilFisico } from "./perfiles";
import { puntuar, type Criterio } from "./puntuacion";

const perro: PerfilFisico = { especie: "Perro", color: "Café", tamano: "MEDIANO" };

describe("motor de puntuación (OCP)", () => {
  it("suma lo que aporta cada criterio y junta las razones", () => {
    const r = puntuar([criterioEspecie(30), criterioColor(40), criterioTamano(30, 10)], perro, perro)!;
    expect(r.puntaje).toBe(100);
    expect(r.razones).toHaveLength(3);
    expect([...r.cumplidos].sort()).toEqual(["color", "especie"]);
  });

  it("un criterio nuevo se agrega sin tocar el motor ni los demás criterios", () => {
    // Característica inventada para la prueba: edad aproximada.
    interface ConEdad extends PerfilFisico {
      edadAnios: number;
    }
    const criterioEdad: Criterio<ConEdad, ConEdad> = {
      nombre: "edad",
      evaluar: (a, b) =>
        Math.abs(a.edadAnios - b.edadAnios) <= 1
          ? { puntos: 10, razones: ["Edad parecida"], cumple: true }
          : { puntos: 0 },
    };
    const a: ConEdad = { ...perro, edadAnios: 3 };
    const b: ConEdad = { ...perro, edadAnios: 4 };

    // Los criterios escritos para PerfilFisico conviven con el nuevo (Liskov).
    const r = puntuar([criterioEspecie(30), criterioColor(40), criterioEdad], a, b)!;
    expect(r.puntaje).toBe(80);
    expect(r.razones).toContain("Edad parecida");
    expect(r.cumplidos.has("edad")).toBe(true);
  });

  it("un criterio puede descartar toda la comparación", () => {
    const blanco: PerfilFisico = { ...perro, color: "Blanco" };
    expect(puntuar([criterioEspecie(30), criterioColor(40, { obligatorio: true })], perro, blanco)).toBeNull();
    // Sin ser obligatorio, solo no suma.
    expect(puntuar([criterioEspecie(30), criterioColor(40)], perro, blanco)!.puntaje).toBe(30);
  });

  it("el puntaje se limita a 0–100", () => {
    const castigo: Criterio<PerfilFisico, PerfilFisico> = {
      nombre: "castigo",
      evaluar: () => ({ puntos: -50 }),
    };
    expect(puntuar([castigo], perro, perro)!.puntaje).toBe(0);
    expect(puntuar([criterioEspecie(80), criterioColor(80)], perro, perro)!.puntaje).toBe(100);
  });
});
