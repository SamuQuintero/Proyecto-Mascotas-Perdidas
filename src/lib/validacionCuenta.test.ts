import { describe, expect, it } from "vitest";
import { loginSchema, registroSchema, suscripcionSchema, establecimientoSchema } from "./validacionCuenta";

describe("registroSchema — HU-16 / HU-17", () => {
  it("acepta un registro de ciudadano sin nombre de clínica", () => {
    const resultado = registroSchema.safeParse({
      nombre: "Ana",
      email: "ana@correo.com",
      contrasena: "123456",
      rol: "CIUDADANO",
    });
    expect(resultado.success).toBe(true);
  });

  it("exige el nombre de la clínica cuando el rol es veterinaria", () => {
    const resultado = registroSchema.safeParse({
      nombre: "Dr. Pérez",
      email: "vet@correo.com",
      contrasena: "123456",
      rol: "VETERINARIA",
    });
    expect(resultado.success).toBe(false);
  });

  it("acepta veterinaria con nombre de clínica", () => {
    const resultado = registroSchema.safeParse({
      nombre: "Dr. Pérez",
      email: "vet@correo.com",
      contrasena: "123456",
      rol: "VETERINARIA",
      nombreClinica: "Veterinaria San Francisco",
    });
    expect(resultado.success).toBe(true);
  });

  it("rechaza una contraseña demasiado corta", () => {
    const resultado = registroSchema.safeParse({
      nombre: "Ana",
      email: "ana@correo.com",
      contrasena: "123",
      rol: "CIUDADANO",
    });
    expect(resultado.success).toBe(false);
  });

  it("normaliza el correo a minúsculas", () => {
    const resultado = registroSchema.safeParse({
      nombre: "Ana",
      email: "ANA@CORREO.COM",
      contrasena: "123456",
      rol: "CIUDADANO",
    });
    expect(resultado.success && resultado.data.email).toBe("ana@correo.com");
  });
});

describe("loginSchema", () => {
  it("rechaza un correo inválido", () => {
    expect(loginSchema.safeParse({ email: "no-es-correo", contrasena: "x" }).success).toBe(false);
  });
});

describe("suscripcionSchema — HU-16 (radio de aviso)", () => {
  it("acepta un radio dentro del rango permitido", () => {
    const resultado = suscripcionSchema.safeParse({ latitud: 1.21, longitud: -77.28, radioKm: 5 });
    expect(resultado.success).toBe(true);
  });

  it("rechaza un radio de 0 km o mayor a 50 km", () => {
    expect(
      suscripcionSchema.safeParse({ latitud: 1.21, longitud: -77.28, radioKm: 0 }).success
    ).toBe(false);
    expect(
      suscripcionSchema.safeParse({ latitud: 1.21, longitud: -77.28, radioKm: 51 }).success
    ).toBe(false);
  });
});

describe("registro de refugio (HU-20)", () => {
  const base = { nombre: "Ana", email: "a@b.co", contrasena: "secreta1", rol: "REFUGIO" as const };

  it("exige el nombre del refugio", () => {
    const r = registroSchema.safeParse(base);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["nombreRefugio"]);
  });

  it("acepta un refugio con nombre", () => {
    expect(registroSchema.safeParse({ ...base, nombreRefugio: "Huellitas" }).success).toBe(true);
  });
});

describe("establecimientoSchema (HU-18)", () => {
  it("permite guardar sin aparecer en el directorio aunque falten datos", () => {
    expect(establecimientoSchema.safeParse({ recibeEncontradas: false }).success).toBe(true);
  });

  it("para aparecer en el directorio exige teléfono y ubicación", () => {
    const r = establecimientoSchema.safeParse({ recibeEncontradas: true });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual(["latitud", "telefono"]);
    }
  });

  it("acepta teléfono y ubicación", () => {
    expect(
      establecimientoSchema.safeParse({
        recibeEncontradas: true,
        telefono: "300 123 4567",
        latitud: 1.21,
        longitud: -77.28,
      }).success
    ).toBe(true);
  });

  it("rechaza un teléfono con letras", () => {
    expect(
      establecimientoSchema.safeParse({ recibeEncontradas: false, telefono: "llámame" }).success
    ).toBe(false);
  });
});
