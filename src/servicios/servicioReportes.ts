import {
  ErrorFotoInvalida,
  type AlmacenFotos,
  type NotificadorCambios,
  type RepositorioReportes,
  type ReporteBD,
} from "@/lib/puertos";
import { puedeCambiarEstado, puedeGestionar } from "@/lib/propiedad";
import { camposParaGuardar } from "@/lib/reportes";
import { puedeRenovar } from "@/lib/renovacion";
import type { EstadoReporte } from "@/lib/tipos";
import { primerErrorPorCampo, reporteSchema } from "@/lib/validacion";
import {
  invalido,
  noEncontrado,
  ok,
  falla,
  sinPermiso,
  type Resultado,
  type Sesion,
} from "./resultado";

// Casos de uso de los reportes (HU-1, 2, 12, 19, 23, 25). Responsabilidad
// única: aplicar las reglas del negocio. No sabe de HTTP, de Prisma ni de
// dónde se guardan las fotos: recibe esas capacidades por el constructor
// (inversión de dependencias), así que se prueba con dobles en memoria.

type DatosCrudos = Record<string, unknown>;

export class ServicioReportes {
  constructor(
    private readonly repositorio: RepositorioReportes,
    private readonly fotos: AlmacenFotos,
    private readonly cambios: NotificadorCambios,
    // El reloj se inyecta para poder probar "no más de una vez al día".
    private readonly ahora: () => Date = () => new Date()
  ) {}

  // HU-1 / HU-2: publicar un reporte (con o sin cuenta).
  async publicar(entrada: {
    datos: DatosCrudos;
    foto: File | null;
    usuarioId: string | null;
  }): Promise<Resultado<ReporteBD>> {
    const { datos, foto, usuarioId } = entrada;

    if (!foto || foto.size === 0) {
      return invalido({ foto: "La fotografía es obligatoria." });
    }

    const validado = reporteSchema.safeParse(datos);
    if (!validado.success) return invalido(primerErrorPorCampo(validado.error));

    const guardada = await this.guardarFoto(foto);
    if (!guardada.ok) return guardada;

    const reporte = await this.repositorio.crear({
      tipo: validado.data.tipo,
      ...camposParaGuardar(validado.data),
      fotoUrl: guardada.valor,
      usuarioId,
    });
    this.cambios.reportesCambiaron();
    return ok(reporte);
  }

  // HU-25 / HU-23: editar (el admin o la cuenta que lo publicó). La foto es
  // opcional: solo se reemplaza si se envía una nueva. El tipo (perdida o
  // encontrada) no cambia al editar.
  async editar(entrada: {
    id: string;
    datos: DatosCrudos;
    foto: File | null;
    sesion: Sesion;
  }): Promise<Resultado<ReporteBD>> {
    const existente = await this.repositorio.buscarPorId(entrada.id);
    if (!existente) return noEncontrado("Reporte no encontrado.");

    if (!puedeGestionar(existente, entrada.sesion)) {
      return sinPermiso(entrada.sesion, {
        sinSesion: "Inicia sesión para editar este reporte.",
        prohibido: "Solo quien publicó el reporte puede editarlo.",
      });
    }

    const validado = reporteSchema.safeParse({ ...entrada.datos, tipo: existente.tipo });
    if (!validado.success) return invalido(primerErrorPorCampo(validado.error));

    let fotoUrl = existente.fotoUrl;
    if (entrada.foto && entrada.foto.size > 0) {
      const guardada = await this.guardarFoto(entrada.foto);
      if (!guardada.ok) return guardada;
      fotoUrl = guardada.valor;
    }

    const reporte = await this.repositorio.actualizar(existente.id, {
      ...camposParaGuardar(validado.data),
      fotoUrl,
    });
    if (fotoUrl !== existente.fotoUrl) await this.fotos.eliminar(existente.fotoUrl);
    this.cambios.reportesCambiaron();
    return ok(reporte);
  }

  // HU-12: cerrar o reabrir un caso. El dueño solo puede cerrar el suyo.
  async cambiarEstado(entrada: {
    id: string;
    estado: EstadoReporte;
    sesion: Sesion;
  }): Promise<Resultado<ReporteBD>> {
    const existente = await this.repositorio.buscarPorId(entrada.id);
    if (!existente) return noEncontrado("Reporte no encontrado.");

    if (!puedeCambiarEstado(existente, entrada.sesion, entrada.estado)) {
      return sinPermiso(entrada.sesion, {
        sinSesion: "Inicia sesión para cerrar este caso.",
        prohibido: "Solo el administrador o quien publicó el reporte puede cerrar el caso.",
      });
    }

    const reporte = await this.repositorio.cambiarEstado(
      existente.id,
      entrada.estado,
      this.ahora()
    );
    this.cambios.reportesCambiaron();
    return ok(reporte);
  }

  // HU-19: confirmar que el caso sigue abierto y volver a difundirlo.
  async renovar(entrada: { id: string; sesion: Sesion }): Promise<Resultado<ReporteBD>> {
    const existente = await this.repositorio.buscarPorId(entrada.id);
    if (!existente) return noEncontrado("Reporte no encontrado.");

    if (!puedeGestionar(existente, entrada.sesion)) {
      return falla({
        tipo: "PROHIBIDO",
        mensaje: "Solo quien publicó el reporte con su cuenta puede renovarlo.",
      });
    }
    if (existente.estado !== "ACTIVO") {
      return falla({ tipo: "CONFLICTO", mensaje: "Este caso ya está cerrado." });
    }
    const ahora = this.ahora();
    if (!puedeRenovar(existente, ahora)) {
      return falla({
        tipo: "DEMASIADO_PRONTO",
        mensaje: "Ya se difundió hoy. Puedes renovarlo de nuevo mañana.",
      });
    }

    const reporte = await this.repositorio.renovar(existente.id, ahora);
    this.cambios.reportesCambiaron();
    return ok(reporte);
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
