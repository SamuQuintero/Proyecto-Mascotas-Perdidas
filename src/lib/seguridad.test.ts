import { afterEach, describe, expect, it, vi } from "vitest";
import { Limitador, ipCliente } from "@/lib/limitador";
import { detectarTipoImagen, limpiarJpeg } from "@/lib/imagen";
import { origenPermitido, reglaDeLimite } from "@/lib/proteccion";
import { leerSecreto } from "@/lib/secretos";
import { hashContrasena, verificarContrasena } from "@/lib/contrasenas";
import { errorDeContrasena } from "@/lib/validacionCuenta";
import { createHmac, scryptSync } from "crypto";

describe("Limitador", () => {
  it("permite hasta el límite y luego bloquea con tiempo de espera", () => {
    const l = new Limitador();
    for (let i = 0; i < 3; i++) expect(l.intentar("a", 3, 1000, 0).permitido).toBe(true);
    const r = l.intentar("a", 3, 1000, 100);
    expect(r.permitido).toBe(false);
    expect(r.reintentarEnSeg).toBe(1);
  });

  it("reinicia al terminar la ventana y separa las claves", () => {
    const l = new Limitador();
    l.intentar("a", 1, 1000, 0);
    expect(l.intentar("a", 1, 1000, 500).permitido).toBe(false);
    expect(l.intentar("b", 1, 1000, 500).permitido).toBe(true);
    expect(l.intentar("a", 1, 1000, 1000).permitido).toBe(true);
  });

  it("bloquea tras N fallos registrados y se libera con olvidar", () => {
    const l = new Limitador();
    for (let i = 0; i < 5; i++) l.registrar("k", 60_000, 0);
    expect(l.bloqueado("k", 5, 60_000, 10).permitido).toBe(false);
    expect(l.bloqueado("k", 5, 60_000, 60_001).permitido).toBe(true);
    l.olvidar("k");
    expect(l.bloqueado("k", 5, 60_000, 10).permitido).toBe(true);
  });

  it("toma la IP del primer valor de x-forwarded-for", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" });
    expect(ipCliente(h)).toBe("1.2.3.4");
    expect(ipCliente(new Headers())).toBe("desconocida");
  });
});

describe("origenPermitido (CSRF)", () => {
  it("acepta el mismo origen y rechaza otro", () => {
    expect(origenPermitido("https://petmatch.co", "petmatch.co", null)).toBe(true);
    expect(origenPermitido("https://malo.com", "petmatch.co", null)).toBe(false);
    expect(origenPermitido("null", "petmatch.co", null)).toBe(false);
  });
  it("sin Origin, solo acepta si el navegador no declara petición cruzada", () => {
    expect(origenPermitido(null, "petmatch.co", "cross-site")).toBe(false);
    expect(origenPermitido(null, "petmatch.co", "same-origin")).toBe(true);
    expect(origenPermitido(null, "petmatch.co", null)).toBe(true);
  });
});

describe("reglaDeLimite", () => {
  it("asigna cubos distintos según la acción", () => {
    expect(reglaDeLimite("POST", "/api/cuenta/registro").nombre).toBe("registro");
    expect(reglaDeLimite("POST", "/api/cuenta/login").nombre).toBe("acceso");
    expect(reglaDeLimite("POST", "/api/reportes").nombre).toBe("publicar");
    expect(reglaDeLimite("PATCH", "/api/reportes/x").nombre).toBe("escritura");
    expect(reglaDeLimite("GET", "/api/alertas").nombre).toBe("lectura");
  });
});

describe("detección y limpieza de imágenes", () => {
  const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const WEBP = Uint8Array.from([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")]);

  it("identifica por los bytes, no por el nombre", () => {
    expect(detectarTipoImagen(PNG)).toBe("image/png");
    expect(detectarTipoImagen(WEBP)).toBe("image/webp");
    expect(detectarTipoImagen(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectarTipoImagen(Buffer.from("<script>alert(1)</script>"))).toBeNull();
    expect(detectarTipoImagen(Buffer.from("GIF89a....."))).toBeNull();
  });

  // JPEG sintético: SOI, APP1 con EXIF (orientación 6 + GPS simulado), COM, SOS.
  function jpegConExif(orientacion: number) {
    const exif = [
      0x45, 0x78, 0x69, 0x66, 0, 0, 0x49, 0x49, 0x2a, 0, 8, 0, 0, 0,
      2, 0,
      0x12, 0x01, 3, 0, 1, 0, 0, 0, orientacion, 0, 0, 0,
      0x25, 0x88, 4, 0, 1, 0, 0, 0, 0x99, 0, 0, 0, // puntero a GPS
      0, 0, 0, 0,
    ];
    const l = exif.length + 2;
    return Uint8Array.from([
      0xff, 0xd8,
      0xff, 0xe1, l >> 8, l & 255, ...exif,
      0xff, 0xfe, 0, 6, 1, 2, 3, 4, // comentario
      0xff, 0xdb, 0, 4, 9, 9, // tabla de cuantización (se conserva)
      0xff, 0xda, 0, 2, 0x11, 0x22, 0x33, 0xff, 0xd9,
    ]);
  }

  it("quita el EXIF y el comentario del JPEG, conserva la imagen y la orientación", () => {
    const limpio = limpiarJpeg(jpegConExif(6));
    const txt = Buffer.from(limpio).toString("latin1");
    expect(txt).not.toContain("\x25\x88"); // sin etiqueta GPS
    expect(txt).toContain("Exif"); // solo el APP1 mínimo con la orientación
    expect(limpio.length).toBeLessThan(jpegConExif(6).length);
    // El APP1 mínimo conserva la orientación 6 y la tabla DQT sigue ahí.
    const i = Buffer.from(limpio).indexOf(Buffer.from([0x12, 0x01, 0x03, 0x00]));
    expect(limpio[i + 8]).toBe(6);
    expect(Buffer.from(limpio).includes(Buffer.from([0xff, 0xdb, 0, 4, 9, 9]))).toBe(true);
    expect(Array.from(limpio.slice(-4))).toEqual([0x22, 0x33, 0xff, 0xd9].map((x) => x));
  });

  it("sin orientación (o 1) no deja ningún EXIF", () => {
    const limpio = limpiarJpeg(jpegConExif(1));
    expect(Buffer.from(limpio).toString("latin1")).not.toContain("Exif");
  });

  it("no toca un JPEG de estructura rara", () => {
    const raro = Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff, 1, 2]);
    expect(limpiarJpeg(raro)).toEqual(raro);
  });
});

describe("secretos", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("en producción exige el secreto y un largo mínimo", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SECRETO_X", "");
    expect(() => leerSecreto("SECRETO_X", "dev")).toThrow(/SECRETO_X/);
    vi.stubEnv("SECRETO_X", "corto");
    expect(() => leerSecreto("SECRETO_X", "dev")).toThrow();
    vi.stubEnv("SECRETO_X", "a".repeat(40));
    expect(leerSecreto("SECRETO_X", "dev")).toBe("a".repeat(40));
  });

  it("en desarrollo usa el respaldo", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SECRETO_Y", "");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(leerSecreto("SECRETO_Y", "dev")).toBe("dev");
  });
});

describe("contraseñas", () => {
  it("usa el formato s2 y verifica", () => {
    const h = hashContrasena("Una-clave-larga-1");
    expect(h.startsWith("s2:")).toBe(true);
    expect(verificarContrasena("Una-clave-larga-1", h)).toBe(true);
    expect(verificarContrasena("otra", h)).toBe(false);
  });

  it("sigue verificando el formato anterior sin prefijo", () => {
    const salt = "ab".repeat(8);
    const antiguo = `${salt}:${scryptSync("vieja123", salt, 64).toString("hex")}`;
    expect(verificarContrasena("vieja123", antiguo)).toBe(true);
    expect(verificarContrasena("vieja124", antiguo)).toBe(false);
  });

  it("aplica la política de contraseñas", () => {
    expect(errorDeContrasena("corta1")).toMatch(/10 caracteres/);
    expect(errorDeContrasena("sololetrasaqui")).toMatch(/letras y números/);
    expect(errorDeContrasena("12345678901")).toMatch(/letras y números/);
    expect(errorDeContrasena("Password12345")).toMatch(/común/);
    expect(errorDeContrasena("juanperez2024xx", "juanperez@mail.com")).toMatch(/correo/);
    expect(errorDeContrasena("Tr3s-Gatos-Azul")).toBeNull();
  });
});

describe("acceso de administrador en producción", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("se deshabilita con una contraseña corta y se habilita con una larga", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_USUARIO", "jefe");
    vi.stubEnv("ADMIN_SECRETO", "s".repeat(40));
    vi.stubEnv("ADMIN_CONTRASENA", "1234");
    const { adminConfigurado } = await import("@/lib/sesion");
    expect(adminConfigurado()).toBe(false);
    vi.stubEnv("ADMIN_CONTRASENA", "una-clave-larga-123");
    expect(adminConfigurado()).toBe(true);
  });
});

describe("sesión firmada", () => {
  it("el HMAC cambia con cualquier alteración del contenido", () => {
    const f = (c: string) => createHmac("sha256", "k").update(c).digest("base64url");
    expect(f("a")).not.toBe(f("b"));
  });
});
