import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DURACION_SESION_MS,
  adminConfigurado,
  credencialesValidas,
  crearTokenSesion,
  verificarTokenSesion,
} from "./sesion";

const entornoOriginal = { ...process.env };

beforeEach(() => {
  process.env.ADMIN_USUARIO = "Samuel";
  process.env.ADMIN_CONTRASENA = "Zeus";
  process.env.ADMIN_SECRETO = "secreto-de-prueba";
});

afterEach(() => {
  process.env = { ...entornoOriginal };
});

describe("credencialesValidas — acceso administrador", () => {
  it("acepta el usuario y la contraseña configurados", () => {
    expect(credencialesValidas("Samuel", "Zeus")).toBe(true);
  });

  it("el usuario no distingue mayúsculas ni espacios alrededor", () => {
    expect(credencialesValidas("  samuel ", "Zeus")).toBe(true);
  });

  it("la contraseña sí distingue mayúsculas", () => {
    expect(credencialesValidas("Samuel", "zeus")).toBe(false);
  });

  it("rechaza un usuario distinto", () => {
    expect(credencialesValidas("Otro", "Zeus")).toBe(false);
  });

  it("sin configuración nadie puede entrar", () => {
    delete process.env.ADMIN_USUARIO;
    delete process.env.ADMIN_CONTRASENA;
    expect(adminConfigurado()).toBe(false);
    expect(credencialesValidas("", "")).toBe(false);
  });
});

describe("token de sesión", () => {
  it("un token recién creado es válido y devuelve el usuario", () => {
    expect(verificarTokenSesion(crearTokenSesion())).toBe("Samuel");
  });

  it("expira después de la duración de la sesión", () => {
    const ahora = Date.now();
    const token = crearTokenSesion(ahora);
    expect(verificarTokenSesion(token, ahora + DURACION_SESION_MS - 1)).toBe("Samuel");
    expect(verificarTokenSesion(token, ahora + DURACION_SESION_MS + 1)).toBeNull();
  });

  it("rechaza un token manipulado", () => {
    const [contenido, firma] = crearTokenSesion().split(".");
    const falso = Buffer.from(
      JSON.stringify({ u: "Samuel", exp: Date.now() + 10 ** 12 })
    ).toString("base64url");
    expect(verificarTokenSesion(`${falso}.${firma}`)).toBeNull();
    expect(verificarTokenSesion(`${contenido}.firma-inventada`)).toBeNull();
    expect(verificarTokenSesion("basura")).toBeNull();
    expect(verificarTokenSesion(undefined)).toBeNull();
  });

  it("cambiar el secreto invalida las sesiones abiertas", () => {
    const token = crearTokenSesion();
    process.env.ADMIN_SECRETO = "otro-secreto";
    expect(verificarTokenSesion(token)).toBeNull();
  });
});
