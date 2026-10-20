import { describe, expect, it } from "vitest";
import {
  DURACION_SESION_MS,
  crearTokenUsuario,
  verificarTokenUsuario,
} from "./sesionUsuario";

describe("token de sesión de usuario (ciudadano / veterinaria)", () => {
  it("un token recién creado es válido y devuelve id, rol y nombre", () => {
    const token = crearTokenUsuario({ id: "abc123", rol: "CIUDADANO", nombre: "Ana" });
    expect(verificarTokenUsuario(token)).toEqual({
      id: "abc123",
      rol: "CIUDADANO",
      nombre: "Ana",
    });
  });

  it("expira después de la duración de la sesión", () => {
    const ahora = Date.now();
    const token = crearTokenUsuario(
      { id: "abc123", rol: "VETERINARIA", nombre: "Dra. Vega" },
      ahora
    );
    expect(verificarTokenUsuario(token, ahora + DURACION_SESION_MS - 1)).not.toBeNull();
    expect(verificarTokenUsuario(token, ahora + DURACION_SESION_MS + 1)).toBeNull();
  });

  it("rechaza un token manipulado, con rol inválido o sin nombre", () => {
    const [contenido, firma] = crearTokenUsuario({
      id: "abc123",
      rol: "CIUDADANO",
      nombre: "Ana",
    }).split(".");
    const falso = Buffer.from(
      JSON.stringify({ id: "otro-id", rol: "VETERINARIA", exp: Date.now() + 10 ** 12 })
    ).toString("base64url");
    expect(verificarTokenUsuario(`${falso}.${firma}`)).toBeNull();
    expect(verificarTokenUsuario(`${contenido}.firma-inventada`)).toBeNull();
    expect(verificarTokenUsuario("basura")).toBeNull();
    expect(verificarTokenUsuario(undefined)).toBeNull();
  });
});
