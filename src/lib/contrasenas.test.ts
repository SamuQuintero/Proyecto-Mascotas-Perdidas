import { describe, expect, it } from "vitest";
import { hashContrasena, verificarContrasena } from "./contrasenas";

describe("hashContrasena / verificarContrasena", () => {
  it("una contraseña correcta verifica contra su propio hash", () => {
    const hash = hashContrasena("miClaveSegura123");
    expect(verificarContrasena("miClaveSegura123", hash)).toBe(true);
  });

  it("una contraseña incorrecta no verifica", () => {
    const hash = hashContrasena("miClaveSegura123");
    expect(verificarContrasena("otraClave", hash)).toBe(false);
  });

  it("dos hashes de la misma contraseña son distintos (salt aleatorio)", () => {
    expect(hashContrasena("repetida")).not.toBe(hashContrasena("repetida"));
  });

  it("rechaza un valor guardado corrupto o vacío", () => {
    expect(verificarContrasena("algo", "")).toBe(false);
    expect(verificarContrasena("algo", "sin-dos-puntos")).toBe(false);
  });
});
