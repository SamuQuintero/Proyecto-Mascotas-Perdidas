import { existsSync } from "fs";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";
import { ErrorArchivoInvalido, guardarFotoReporte } from "./almacenamiento";

const archivosGenerados: string[] = [];

function crearArchivoFalso(nombre: string, tipo: string, bytes: number) {
  const contenido = new Uint8Array(bytes);
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

  afterAll(async () => {
    const { unlink } = await import("fs/promises");
    for (const url of archivosGenerados) {
      const ruta = path.join(process.cwd(), "public", url);
      await unlink(ruta).catch(() => {});
    }
  });
});
