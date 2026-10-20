import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { extraerColorDominante } from "./colorImagen";

// Genera una imagen de prueba de un solo color (o dos, en franjas) sin
// depender de ningún archivo en disco.
function imagenSolida(r: number, g: number, b: number): Promise<Buffer> {
  return sharp({
    create: { width: 40, height: 40, channels: 3, background: { r, g, b } },
  })
    .jpeg()
    .toBuffer();
}

async function imagenAbigarrada(): Promise<Buffer> {
  const mitad = await sharp({
    create: { width: 20, height: 40, channels: 3, background: { r: 10, g: 10, b: 10 } },
  })
    .png()
    .toBuffer();
  const otraMitad = await sharp({
    create: { width: 20, height: 40, channels: 3, background: { r: 245, g: 245, b: 245 } },
  })
    .png()
    .toBuffer();
  return sharp({
    create: { width: 40, height: 40, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([
      { input: mitad, left: 0, top: 0 },
      { input: otraMitad, left: 20, top: 0 },
    ])
    .jpeg()
    .toBuffer();
}

describe("extraerColorDominante — HU-10 (buscar por foto)", () => {
  it("una foto negra sólida se detecta como familia 'negro'", async () => {
    const { familia } = await extraerColorDominante(await imagenSolida(20, 20, 20));
    expect(familia).toBe("negro");
  });

  it("una foto blanca sólida se detecta como familia 'blanco'", async () => {
    const { familia } = await extraerColorDominante(await imagenSolida(245, 245, 240));
    expect(familia).toBe("blanco");
  });

  it("una foto café sólida se detecta como familia 'cafe'", async () => {
    const { familia } = await extraerColorDominante(await imagenSolida(92, 64, 44));
    expect(familia).toBe("cafe");
  });

  it("una foto en blanco y negro (mitad y mitad) se detecta como 'manchado'", async () => {
    const { familia, variacion } = await extraerColorDominante(await imagenAbigarrada());
    expect(familia).toBe("manchado");
    expect(variacion).toBeGreaterThan(55);
  });
});
