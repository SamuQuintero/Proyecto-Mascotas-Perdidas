import { describe, expect, it } from "vitest";
import {
  enlaceCompartirFacebook,
  enlaceCompartirWhatsApp,
  enlaceCompartirX,
  textoParaCompartir,
  vistaPreviaReporte,
} from "./compartir";

const perdida = {
  tipo: "PERDIDA" as const,
  nombre: "Toby",
  especie: "Perro",
  color: "Café",
  zona: "Pasto",
};
const URL = "https://petmatch.co/reportes/abc?x=1&y=2";

describe("compartir reporte (HU-21)", () => {
  it("redacta el texto de una pérdida con el nombre", () => {
    expect(textoParaCompartir(perdida)).toBe(
      "¡Ayuda! Se perdió Toby (perro, café) en Pasto. Mira el reporte:"
    );
  });

  it("redacta el texto de una pérdida sin nombre", () => {
    expect(textoParaCompartir({ ...perdida, nombre: null })).toBe(
      "¡Ayuda! Se perdió un perro, café en Pasto. Mira el reporte:"
    );
  });

  it("redacta el texto de un hallazgo", () => {
    expect(textoParaCompartir({ ...perdida, tipo: "ENCONTRADA", nombre: null })).toContain(
      "Encontraron un perro, café en Pasto"
    );
  });

  it("incluye el enlace al reporte, codificado, en cada red", () => {
    const codificada = encodeURIComponent(URL);
    expect(enlaceCompartirWhatsApp(URL, "Hola")).toContain(encodeURIComponent(`Hola ${URL}`));
    expect(enlaceCompartirFacebook(URL)).toContain(`u=${codificada}`);
    expect(enlaceCompartirX(URL, "Hola")).toContain(`url=${codificada}`);
  });

  it("arma la vista previa con título y descripción", () => {
    const { titulo, descripcion } = vistaPreviaReporte(perdida);
    expect(titulo).toBe("Se perdió Toby en Pasto — PetMatch");
    expect(descripcion).toContain("café");
  });
});
