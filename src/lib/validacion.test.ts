import { describe, expect, it } from "vitest";
import { fechaParaInput, horaParaInput } from "./formato";
import { mascotaSchema, primerErrorPorCampo, reporteSchema } from "./validacion";

const datosBasePerdida = {
  tipo: "PERDIDA" as const,
  especie: "Perro",
  color: "Café con blanco",
  tamano: "MEDIANO" as const,
  zona: "Barrio Santa Bárbara",
  fecha: "2026-01-01",
  hora: "15:30",
  latitud: 4.71,
  longitud: -74.07,
  contactoTelefono: "3001234567",
};

const datosBaseEncontrada = {
  tipo: "ENCONTRADA" as const,
  especie: "Gato",
  color: "Negro",
  tamano: "PEQUENO" as const,
  zona: "Cerca al parque principal",
  fecha: "2026-01-01",
  hora: "08:05",
  latitud: 4.6,
  longitud: -74.08,
  reportanteAnonimo: true,
};

describe("reporteSchema — HU-13 (datos mínimos obligatorios)", () => {
  it("acepta un reporte de mascota perdida con los datos mínimos y contacto", () => {
    const resultado = reporteSchema.safeParse(datosBasePerdida);
    expect(resultado.success).toBe(true);
  });

  it("acepta un reporte de mascota encontrada anónimo (HU-2)", () => {
    const resultado = reporteSchema.safeParse(datosBaseEncontrada);
    expect(resultado.success).toBe(true);
  });

  it("rechaza un reporte de mascota perdida sin contacto", () => {
    const { contactoTelefono, ...sinContacto } = datosBasePerdida;
    const resultado = reporteSchema.safeParse(sinContacto);
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      const errores = primerErrorPorCampo(resultado.error);
      expect(errores.contactoTelefono).toBeDefined();
    }
  });

  it("rechaza cuando falta la especie", () => {
    const { especie, ...sinEspecie } = datosBasePerdida;
    const resultado = reporteSchema.safeParse(sinEspecie);
    expect(resultado.success).toBe(false);
  });

  it("rechaza cuando falta el color", () => {
    const { color, ...sinColor } = datosBasePerdida;
    const resultado = reporteSchema.safeParse(sinColor);
    expect(resultado.success).toBe(false);
  });

  it("rechaza cuando falta el tamaño", () => {
    const { tamano, ...sinTamano } = datosBasePerdida;
    const resultado = reporteSchema.safeParse(sinTamano);
    expect(resultado.success).toBe(false);
  });

  it("rechaza cuando falta la zona", () => {
    const { zona, ...sinZona } = datosBasePerdida;
    const resultado = reporteSchema.safeParse(sinZona);
    expect(resultado.success).toBe(false);
  });

  it("rechaza una fecha futura", () => {
    const conFechaFutura = { ...datosBasePerdida, fecha: "2099-01-01" };
    const resultado = reporteSchema.safeParse(conFechaFutura);
    expect(resultado.success).toBe(false);
  });

  it("rechaza cuando no hay ubicación (HU-3)", () => {
    const { latitud, longitud, ...sinUbicacion } = datosBasePerdida;
    const resultado = reporteSchema.safeParse(sinUbicacion);
    expect(resultado.success).toBe(false);
  });

  it("rechaza un tipo de reporte desconocido", () => {
    const resultado = reporteSchema.safeParse({
      ...datosBasePerdida,
      tipo: "OTRO",
    });
    expect(resultado.success).toBe(false);
  });

  it("interpreta 'false' enviado por FormData como no anónimo", () => {
    const resultado = reporteSchema.safeParse({
      ...datosBasePerdida,
      reportanteAnonimo: "false",
    });
    expect(resultado.success && resultado.data.reportanteAnonimo).toBe(false);
  });

  it("interpreta 'true' enviado por FormData como anónimo", () => {
    const resultado = reporteSchema.safeParse({
      ...datosBaseEncontrada,
      reportanteAnonimo: "true",
    });
    expect(resultado.success && resultado.data.reportanteAnonimo).toBe(true);
  });

  it("exige la hora aproximada", () => {
    const { hora, ...sinHora } = datosBasePerdida;
    const resultado = reporteSchema.safeParse(sinHora);
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(primerErrorPorCampo(resultado.error).hora).toBeDefined();
    }
  });

  it("rechaza una hora con formato inválido", () => {
    const resultado = reporteSchema.safeParse({ ...datosBasePerdida, hora: "25:00" });
    expect(resultado.success).toBe(false);
  });

  it("rechaza una hora futura del día de hoy", () => {
    const enDosHoras = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const resultado = reporteSchema.safeParse({
      ...datosBasePerdida,
      fecha: fechaParaInput(enDosHoras),
      hora: horaParaInput(enDosHoras),
    });
    expect(resultado.success).toBe(false);
  });
});

describe("mascotaSchema — HU-8 (perfil con QR)", () => {
  const perfil = {
    nombre: "Toby",
    especie: "Perro",
    color: "Café",
    tamano: "MEDIANO",
    contactoNombre: "Samuel",
    contactoTelefono: "300 123 4567",
  };

  it("acepta un perfil con los datos mínimos", () => {
    expect(mascotaSchema.safeParse(perfil).success).toBe(true);
  });

  it("exige un teléfono válido para que puedan contactar al dueño", () => {
    expect(mascotaSchema.safeParse({ ...perfil, contactoTelefono: "" }).success).toBe(false);
    expect(mascotaSchema.safeParse({ ...perfil, contactoTelefono: "llámame" }).success).toBe(false);
  });

  it("exige el nombre de la mascota", () => {
    expect(mascotaSchema.safeParse({ ...perfil, nombre: " " }).success).toBe(false);
  });
});
