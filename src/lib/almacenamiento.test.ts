import { existsSync } from "fs";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import {
  ErrorArchivoInvalido,
  eliminarFotoReporte,
  guardarFotoReporte,
} from "./almacenamiento";

const archivosGenerados: string[] = [];

function crearArchivoFalso(nombre: string, tipo: string, bytes: number) {
  // Cabecera real según el tipo declarado (se valida por los primeros bytes).
  const contenido = new Uint8Array(bytes);
  const cabecera =
    tipo === "image/png" ? [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] : [0xff, 0xd8, 0xff, 0xe0];
  contenido.set(cabecera.slice(0, Math.min(cabecera.length, bytes)));
  return new File([contenido], nombre, { type: tipo });
}

describe("guardarFotoReporte — almacenamiento de fotografías", () => {
  it("guarda una imagen válida y devuelve una URL bajo /uploads", async () => {
    const archivo = crearArchivoFalso("mascota.jpg", "image/jpeg", 1024);
    const url = await guardarFotoReporte(archivo);
    archivosGenerados.push(url);

    expect(url).toMatch(/^\/uploads\/.+\.jpg$/);
    const rutaDisco = path.join(process.cwd(), "public", url);
    expect(existsSync(rutaDisco)).toBe(true);
  });

  it("rechaza un archivo que dice ser imagen pero no lo es", async () => {
    const falso = new File([new TextEncoder().encode("<script>alert(1)</script>")], "x.jpg", {
      type: "image/jpeg",
    });
    await expect(guardarFotoReporte(falso)).rejects.toThrow(ErrorArchivoInvalido);
    const pngComoJpeg = new File([crearArchivoFalso("a.png", "image/png", 64)], "a.jpg", {
      type: "image/jpeg",
    });
    await expect(guardarFotoReporte(pngComoJpeg)).rejects.toThrow(ErrorArchivoInvalido);
  });

  it("rechaza un formato de archivo no soportado", async () => {
    const archivo = crearArchivoFalso("documento.pdf", "application/pdf", 1024);
    await expect(guardarFotoReporte(archivo)).rejects.toThrow(
      ErrorArchivoInvalido
    );
  });

  it("rechaza una imagen que supera el tamaño máximo", async () => {
    const archivo = crearArchivoFalso(
      "mascota-grande.jpg",
      "image/jpeg",
      6 * 1024 * 1024
    );
    await expect(guardarFotoReporte(archivo)).rejects.toThrow(
      ErrorArchivoInvalido
    );
  });

  it("elimina una foto reemplazada al editar (HU-25)", async () => {
    const archivo = crearArchivoFalso("vieja.png", "image/png", 512);
    const url = await guardarFotoReporte(archivo);
    const rutaDisco = path.join(process.cwd(), "public", url);
    expect(existsSync(rutaDisco)).toBe(true);

    await eliminarFotoReporte(url);
    expect(existsSync(rutaDisco)).toBe(false);
  });

  it("no borra nada fuera de la carpeta de fotos", async () => {
    await eliminarFotoReporte("/uploads/../../package.json");
    expect(existsSync(path.join(process.cwd(), "package.json"))).toBe(true);
  });

  afterAll(async () => {
    const { unlink } = await import("fs/promises");
    for (const url of archivosGenerados) {
      const ruta = path.join(process.cwd(), "public", url);
      await unlink(ruta).catch(() => {});
    }
  });
});
