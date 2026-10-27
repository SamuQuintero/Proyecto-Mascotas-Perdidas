import { camposMascotaParaGuardar } from "@/lib/mascotas";
import {
  ErrorFotoInvalida,
  type AlmacenFotos,
  type MascotaBD,
  type RepositorioMascotas,
} from "@/lib/puertos";
import { puedeGestionar } from "@/lib/propiedad";
import { mascotaSchema, primerErrorPorCampo } from "@/lib/validacion";
import { invalido, noEncontrado, ok, sinPermiso, type Resultado, type Sesion } from "./resultado";

// Casos de uso del perfil de mascota con placa QR (HU-8, HU-23). Mismo
// patrón que ServicioReportes: reglas aquí, detalles técnicos inyectados.

type DatosCrudos = Record<string, unknown>;

export class ServicioMascotas {
  constructor(
    private readonly repositorio: RepositorioMascotas,
    private readonly fotos: AlmacenFotos
  ) {}

  // HU-8: crear el perfil (con o sin cuenta).
  async crear(entrada: {
    datos: DatosCrudos;
    foto: File | null;
    usuarioId: string | null;
  }): Promise<Resultado<MascotaBD>> {
    if (!entrada.foto || entrada.foto.size === 0) {
      return invalido({ foto: "La fotografía es obligatoria." });
    }
    const validado = mascotaSchema.safeParse(entrada.datos);
    if (!validado.success) return invalido(primerErrorPorCampo(validado.error));

    const foto = await this.guardarFoto(entrada.foto);
    if (!foto.ok) return foto;

    return ok(
      await this.repositorio.crear({
        ...camposMascotaParaGuardar(validado.data),
        fotoUrl: foto.valor,
        usuarioId: entrada.usuarioId,
      })
    );
  }

  // HU-23: el dueño (o el admin) actualiza contacto, señas o foto.
  async editar(entrada: {
    id: string;
    datos: DatosCrudos;
    foto: File | null;
    sesion: Sesion;
  }): Promise<Resultado<MascotaBD>> {
    const existente = await this.repositorio.buscarPorId(entrada.id);
    if (!existente) return noEncontrado("Mascota no encontrada.");

    if (!puedeGestionar(existente, entrada.sesion)) {
      return sinPermiso(entrada.sesion, {
        sinSesion: "Inicia sesión para editar este perfil.",
        prohibido: "Solo quien creó el perfil puede editarlo.",
      });
    }

    const validado = mascotaSchema.safeParse(entrada.datos);
    if (!validado.success) return invalido(primerErrorPorCampo(validado.error));

    let fotoUrl = existente.fotoUrl;
    if (entrada.foto && entrada.foto.size > 0) {
      const foto = await this.guardarFoto(entrada.foto);
      if (!foto.ok) return foto;
      fotoUrl = foto.valor;
    }

    const mascota = await this.repositorio.actualizar(existente.id, {
      ...camposMascotaParaGuardar(validado.data),
      fotoUrl,
    });
    if (fotoUrl !== existente.fotoUrl) await this.fotos.eliminar(existente.fotoUrl);
    return ok(mascota);
  }

  private async guardarFoto(foto: File): Promise<Resultado<string>> {
    try {
      return ok(await this.fotos.guardar(foto));
    } catch (error) {
      if (error instanceof ErrorFotoInvalida) return invalido({ foto: error.message });
      throw error;
    }
  }
}
