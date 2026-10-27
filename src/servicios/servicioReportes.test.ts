import { beforeEach, describe, expect, it } from "vitest";
import {
  AlmacenFotosEnMemoria,
  NotificadorEspia,
  RepositorioReportesEnMemoria,
  foto,
} from "./dobles";
import { ServicioReportes } from "./servicioReportes";

const DATOS_VALIDOS = {
  tipo: "PERDIDA",
  especie: "Perro",
  color: "Café",
  tamano: "MEDIANO",
  zona: "Centro",
  fecha: "2026-01-10",
  hora: "10:30",
  latitud: "1.2136",
  longitud: "-77.2811",
  contactoTelefono: "300 123 4567",
  reportanteAnonimo: "false",
};

const VISITANTE = { usuarioId: null, esAdmin: false };
const DUENO = { usuarioId: "u1", esAdmin: false };
const OTRO = { usuarioId: "u2", esAdmin: false };
const ADMIN = { usuarioId: null, esAdmin: true };

describe("ServicioReportes (con dobles en memoria, sin base de datos)", () => {
  let repo: RepositorioReportesEnMemoria;
  let fotos: AlmacenFotosEnMemoria;
  let cambios: NotificadorEspia;
  let ahora: Date;
  let servicio: ServicioReportes;

  beforeEach(() => {
    repo = new RepositorioReportesEnMemoria();
    fotos = new AlmacenFotosEnMemoria();
    cambios = new NotificadorEspia();
    ahora = new Date("2026-03-20T12:00:00Z");
    servicio = new ServicioReportes(repo, fotos, cambios, () => ahora);
  });

  async function publicado(usuarioId: string | null = "u1") {
    const r = await servicio.publicar({ datos: DATOS_VALIDOS, foto: foto(), usuarioId });
    if (!r.ok) throw new Error("no se pudo preparar el reporte");
    return r.valor;
  }

  describe("publicar", () => {
    it("guarda la foto, crea el reporte con su dueño y avisa del cambio", async () => {
      const r = await servicio.publicar({ datos: DATOS_VALIDOS, foto: foto(), usuarioId: "u1" });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.valor).toMatchObject({ tipo: "PERDIDA", usuarioId: "u1", fotoUrl: fotos.guardadas[0] });
      expect(cambios.avisosReportes).toBe(1);
    });

    it("permite publicar sin cuenta (sin dueño)", async () => {
      const r = await servicio.publicar({ datos: DATOS_VALIDOS, foto: foto(), usuarioId: null });
      expect(r.ok && r.valor.usuarioId).toBe(null);
    });

    it("exige la foto y no guarda nada", async () => {
      const r = await servicio.publicar({ datos: DATOS_VALIDOS, foto: null, usuarioId: null });
      expect(r).toEqual({
        ok: false,
        falla: { tipo: "INVALIDO", errores: { foto: "La fotografía es obligatoria." } },
      });
      expect(repo.filas.size).toBe(0);
    });

    it("rechaza datos inválidos sin guardar la foto", async () => {
      const r = await servicio.publicar({
        datos: { ...DATOS_VALIDOS, color: "" },
        foto: foto(),
        usuarioId: null,
      });
      expect(!r.ok && r.falla.tipo).toBe("INVALIDO");
      expect(fotos.guardadas).toHaveLength(0);
      expect(cambios.avisosReportes).toBe(0);
    });

    it("traduce una foto inválida a error del campo foto", async () => {
      const r = await servicio.publicar({
        datos: DATOS_VALIDOS,
        foto: foto("application/pdf"),
        usuarioId: null,
      });
      expect(!r.ok && r.falla).toMatchObject({ tipo: "INVALIDO", errores: { foto: expect.any(String) } });
      expect(repo.filas.size).toBe(0);
    });
  });

  describe("editar", () => {
    it("el dueño edita y, si cambia la foto, borra la anterior", async () => {
      const original = await publicado();
      const r = await servicio.editar({
        id: original.id,
        datos: { ...DATOS_VALIDOS, color: "Negro" },
        foto: foto(),
        sesion: DUENO,
      });
      expect(r.ok && r.valor.color).toBe("Negro");
      expect(fotos.eliminadas).toEqual([original.fotoUrl]);
    });

    it("sin foto nueva conserva la anterior", async () => {
      const original = await publicado();
      await servicio.editar({ id: original.id, datos: DATOS_VALIDOS, foto: null, sesion: DUENO });
      expect(repo.filas.get(original.id)!.fotoUrl).toBe(original.fotoUrl);
      expect(fotos.eliminadas).toHaveLength(0);
    });

    it("un visitante sin sesión recibe SIN_SESION y otro usuario PROHIBIDO", async () => {
      const original = await publicado();
      const sinSesion = await servicio.editar({ id: original.id, datos: DATOS_VALIDOS, foto: null, sesion: VISITANTE });
      const ajeno = await servicio.editar({ id: original.id, datos: DATOS_VALIDOS, foto: null, sesion: OTRO });
      expect(!sinSesion.ok && sinSesion.falla.tipo).toBe("SIN_SESION");
      expect(!ajeno.ok && ajeno.falla.tipo).toBe("PROHIBIDO");
    });

    it("el admin edita cualquier reporte, incluso sin dueño", async () => {
      const original = await publicado(null);
      const r = await servicio.editar({ id: original.id, datos: DATOS_VALIDOS, foto: null, sesion: ADMIN });
      expect(r.ok).toBe(true);
    });

    it("no cambia el tipo del reporte", async () => {
      const original = await publicado();
      const r = await servicio.editar({
        id: original.id,
        datos: { ...DATOS_VALIDOS, tipo: "ENCONTRADA" },
        foto: null,
        sesion: DUENO,
      });
      expect(r.ok && r.valor.tipo).toBe("PERDIDA");
    });

    it("reporta NO_ENCONTRADO si no existe", async () => {
      const r = await servicio.editar({ id: "nada", datos: DATOS_VALIDOS, foto: null, sesion: ADMIN });
      expect(!r.ok && r.falla.tipo).toBe("NO_ENCONTRADO");
    });
  });

  describe("cambiarEstado", () => {
    it("el dueño cierra su caso pero no puede reabrirlo; el admin sí", async () => {
      const original = await publicado();
      const cierra = await servicio.cambiarEstado({ id: original.id, estado: "REENCONTRADA", sesion: DUENO });
      expect(cierra.ok && cierra.valor.estado).toBe("REENCONTRADA");
      expect(cierra.ok && cierra.valor.reencontradaEn).toEqual(ahora);

      const reabre = await servicio.cambiarEstado({ id: original.id, estado: "ACTIVO", sesion: DUENO });
      expect(!reabre.ok && reabre.falla.tipo).toBe("PROHIBIDO");

      const admin = await servicio.cambiarEstado({ id: original.id, estado: "ACTIVO", sesion: ADMIN });
      expect(admin.ok && admin.valor.reencontradaEn).toBe(null);
    });

    it("un tercero no puede cerrar el caso", async () => {
      const original = await publicado();
      const r = await servicio.cambiarEstado({ id: original.id, estado: "REENCONTRADA", sesion: OTRO });
      expect(!r.ok && r.falla.tipo).toBe("PROHIBIDO");
    });
  });

  describe("renovar", () => {
    it("el dueño renueva pasado un día y se cuenta la renovación", async () => {
      const original = await publicado();
      ahora = new Date("2026-03-22T12:00:00Z");
      const r = await servicio.renovar({ id: original.id, sesion: DUENO });
      expect(r.ok && r.valor.renovaciones).toBe(1);
      expect(r.ok && r.valor.renovadoEn).toEqual(ahora);
    });

    it("no se puede renovar dos veces el mismo día", async () => {
      const original = await publicado();
      ahora = new Date("2026-03-22T12:00:00Z");
      await servicio.renovar({ id: original.id, sesion: DUENO });
      ahora = new Date("2026-03-22T18:00:00Z");
      const r = await servicio.renovar({ id: original.id, sesion: DUENO });
      expect(!r.ok && r.falla.tipo).toBe("DEMASIADO_PRONTO");
    });

    it("no renueva un caso cerrado ni uno ajeno", async () => {
      const original = await publicado();
      ahora = new Date("2026-03-25T12:00:00Z");
      const ajeno = await servicio.renovar({ id: original.id, sesion: OTRO });
      expect(!ajeno.ok && ajeno.falla.tipo).toBe("PROHIBIDO");

      await servicio.cambiarEstado({ id: original.id, estado: "REENCONTRADA", sesion: ADMIN });
      const cerrado = await servicio.renovar({ id: original.id, sesion: DUENO });
      expect(!cerrado.ok && cerrado.falla.tipo).toBe("CONFLICTO");
    });
  });
});
