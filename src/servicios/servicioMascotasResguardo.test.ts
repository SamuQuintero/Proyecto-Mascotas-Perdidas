import { beforeEach, describe, expect, it } from "vitest";
import {
  AlmacenFotosEnMemoria,
  NotificadorEspia,
  RepositorioMascotasEnMemoria,
  RepositorioResguardoEnMemoria,
  foto,
} from "./dobles";
import { ServicioMascotas } from "./servicioMascotas";
import { ServicioResguardo } from "./servicioResguardo";

const MASCOTA = {
  nombre: "Toby",
  especie: "Perro",
  color: "Café",
  tamano: "MEDIANO",
  contactoNombre: "Camila",
  contactoTelefono: "300 123 4567",
};
const SESION_DUENO = { usuarioId: "u1", esAdmin: false };

describe("ServicioMascotas", () => {
  let repo: RepositorioMascotasEnMemoria;
  let fotos: AlmacenFotosEnMemoria;
  let servicio: ServicioMascotas;

  beforeEach(() => {
    repo = new RepositorioMascotasEnMemoria();
    fotos = new AlmacenFotosEnMemoria();
    servicio = new ServicioMascotas(repo, fotos);
  });

  it("crea el perfil a nombre de la cuenta, o sin dueño si no hay sesión", async () => {
    const conCuenta = await servicio.crear({ datos: MASCOTA, foto: foto(), usuarioId: "u1" });
    const sinCuenta = await servicio.crear({ datos: MASCOTA, foto: foto(), usuarioId: null });
    expect(conCuenta.ok && conCuenta.valor.usuarioId).toBe("u1");
    expect(sinCuenta.ok && sinCuenta.valor.usuarioId).toBe(null);
  });

  it("exige foto y datos válidos", async () => {
    const sinFoto = await servicio.crear({ datos: MASCOTA, foto: null, usuarioId: null });
    const sinNombre = await servicio.crear({ datos: { ...MASCOTA, nombre: "" }, foto: foto(), usuarioId: null });
    expect(!sinFoto.ok && sinFoto.falla.tipo).toBe("INVALIDO");
    expect(!sinNombre.ok && sinNombre.falla.tipo).toBe("INVALIDO");
    expect(repo.filas.size).toBe(0);
  });

  it("solo el dueño o el admin editan; cambiar la foto borra la anterior", async () => {
    const creada = await servicio.crear({ datos: MASCOTA, foto: foto(), usuarioId: "u1" });
    if (!creada.ok) throw new Error("preparación");
    const id = creada.valor.id;

    const ajeno = await servicio.editar({ id, datos: MASCOTA, foto: null, sesion: { usuarioId: "u2", esAdmin: false } });
    expect(!ajeno.ok && ajeno.falla.tipo).toBe("PROHIBIDO");

    const dueno = await servicio.editar({
      id,
      datos: { ...MASCOTA, contactoTelefono: "311 000 0000" },
      foto: foto(),
      sesion: SESION_DUENO,
    });
    expect(dueno.ok && dueno.valor.contactoTelefono).toBe("311 000 0000");
    expect(fotos.eliminadas).toEqual([creada.valor.fotoUrl]);
  });

  it("guarda las señas de gato solo si la especie es Gato", async () => {
    const gato = await servicio.crear({
      datos: { ...MASCOTA, especie: "Gato", patronPelaje: "Atigrado" },
      foto: foto(),
      usuarioId: null,
    });
    const perro = await servicio.crear({
      datos: { ...MASCOTA, patronPelaje: "Atigrado" },
      foto: foto(),
      usuarioId: null,
    });
    expect(gato.ok && gato.valor.patronPelaje).toBe("Atigrado");
    expect(perro.ok && perro.valor.patronPelaje).toBe(null);
  });
});

describe("ServicioResguardo", () => {
  const ANIMAL = { especie: "Perro", color: "Negro", tamano: "GRANDE", desde: "2026-01-10" };
  let repo: RepositorioResguardoEnMemoria;
  let fotos: AlmacenFotosEnMemoria;
  let cambios: NotificadorEspia;
  let servicio: ServicioResguardo;

  beforeEach(() => {
    repo = new RepositorioResguardoEnMemoria();
    fotos = new AlmacenFotosEnMemoria();
    cambios = new NotificadorEspia();
    servicio = new ServicioResguardo(repo, fotos, cambios, () => new Date("2026-03-20T12:00:00Z"));
  });

  it("publica un animal a nombre del refugio y avisa del cambio", async () => {
    const r = await servicio.publicar({ refugioId: "ref1", datos: ANIMAL, foto: foto() });
    expect(r.ok && r.valor).toMatchObject({ refugioId: "ref1", estado: "EN_RESGUARDO" });
    expect(cambios.avisosResguardo).toBe(1);
  });

  it("exige foto, y fecha de ingreso no futura", async () => {
    const sinFoto = await servicio.publicar({ refugioId: "ref1", datos: ANIMAL, foto: null });
    const futuro = await servicio.publicar({ refugioId: "ref1", datos: { ...ANIMAL, desde: "2999-01-01" }, foto: foto() });
    expect(!sinFoto.ok && sinFoto.falla.tipo).toBe("INVALIDO");
    expect(!futuro.ok && futuro.falla.tipo).toBe("INVALIDO");
  });

  it("cada refugio solo gestiona sus animales (los ajenos parecen inexistentes)", async () => {
    const creado = await servicio.publicar({ refugioId: "ref1", datos: ANIMAL, foto: foto() });
    if (!creado.ok) throw new Error("preparación");
    const id = creado.valor.id;

    const ajeno = await servicio.marcarEntregado({ id, refugioId: "ref2" });
    expect(!ajeno.ok && ajeno.falla.tipo).toBe("NO_ENCONTRADO");
    expect(repo.filas.get(id)!.estado).toBe("EN_RESGUARDO");

    const propio = await servicio.marcarEntregado({ id, refugioId: "ref1" });
    expect(propio.ok).toBe(true);
    expect(repo.filas.get(id)!.estado).toBe("ENTREGADO");
    expect(repo.filas.get(id)!.entregadoEn).toEqual(new Date("2026-03-20T12:00:00Z"));
  });

  it("al borrar elimina el animal y su foto", async () => {
    const creado = await servicio.publicar({ refugioId: "ref1", datos: ANIMAL, foto: foto() });
    if (!creado.ok) throw new Error("preparación");
    const r = await servicio.eliminar({ id: creado.valor.id, refugioId: "ref1" });
    expect(r.ok).toBe(true);
    expect(repo.filas.size).toBe(0);
    expect(fotos.eliminadas).toEqual([creado.valor.fotoUrl]);
  });
});
