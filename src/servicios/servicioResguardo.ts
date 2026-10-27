import { instanteColombia } from "@/lib/formato";
import {
  ErrorFotoInvalida,
  type AlmacenFotos,
  type AnimalResguardoBD,
  type NotificadorCambios,
  type RepositorioResguardo,
} from "@/lib/puertos";
import { animalResguardoSchema } from "@/lib/resguardo";
import { primerErrorPorCampo } from "@/lib/validacion";
import { invalido, noEncontrado, ok, type Resultado } from "./resultado";

// Casos de uso de los animales en resguardo (HU-20). Cada refugio solo
// gestiona los suyos.

export class ServicioResguardo {
  constructor(
    private readonly repositorio: RepositorioResguardo,
    private readonly fotos: AlmacenFotos,
    private readonly cambios: NotificadorCambios,
    private readonly ahora: () => Date = () => new Date()
  ) {}

  async publicar(entrada: {
    refugioId: string;
    datos: Record<string, unknown>;
    foto: File | null;
  }): Promise<Resultado<AnimalResguardoBD>> {
    if (!entrada.foto || entrada.foto.size === 0) {
      return invalido({ foto: "La fotografía es obligatoria." });
    }
    const validado = animalResguardoSchema.safeParse(entrada.datos);
    if (!validado.success) return invalido(primerErrorPorCampo(validado.error));

    let fotoUrl: string;
    try {
      fotoUrl = await this.fotos.guardar(entrada.foto);
    } catch (error) {
      if (error instanceof ErrorFotoInvalida) return invalido({ foto: error.message });
      throw error;
    }

    const d = validado.data;
    const animal = await this.repositorio.crear({
      refugioId: entrada.refugioId,
      especie: d.especie,
      nombre: d.nombre || null,
      raza: d.raza || null,
      color: d.color,
      tamano: d.tamano,
      senasParticulares: d.senasParticulares || null,
      fotoUrl,
      desde: instanteColombia(d.desde),
    });
    this.cambios.resguardoCambio();
    return ok(animal);
  }

  // Sale del listado público (a su dueño o adoptado).
  async marcarEntregado(entrada: { id: string; refugioId: string }): Promise<Resultado<true>> {
    const animal = await this.propio(entrada);
    if (!animal) return noEncontrado("Animal no encontrado.");
    await this.repositorio.marcarEntregado(animal.id, this.ahora());
    this.cambios.resguardoCambio();
    return ok(true);
  }

  // Borrar una publicación hecha por error (y su foto).
  async eliminar(entrada: { id: string; refugioId: string }): Promise<Resultado<true>> {
    const animal = await this.propio(entrada);
    if (!animal) return noEncontrado("Animal no encontrado.");
    await this.repositorio.eliminar(animal.id);
    await this.fotos.eliminar(animal.fotoUrl);
    this.cambios.resguardoCambio();
    return ok(true);
  }

  // Un animal ajeno se trata como inexistente: no revela que existe.
  private async propio(entrada: { id: string; refugioId: string }) {
    const animal = await this.repositorio.buscarPorId(entrada.id);
    return animal && animal.refugioId === entrada.refugioId ? animal : null;
  }
}
