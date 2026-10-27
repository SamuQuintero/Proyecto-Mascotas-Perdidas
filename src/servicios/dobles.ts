// Dobles de prueba (en memoria) de los puertos de src/lib/puertos.ts. Solo
// los usan las pruebas de los servicios: gracias a la inversión de
// dependencias, los casos de uso se verifican sin base de datos, sin disco y
// sin Next.js.

import {
  ErrorFotoInvalida,
  type AlmacenFotos,
  type AnimalResguardoBD,
  type CambiosMascota,
  type CambiosReporte,
  type DatosNuevaMascota,
  type DatosNuevoAnimal,
  type DatosNuevoReporte,
  type MascotaBD,
  type NotificadorCambios,
  type RepositorioMascotas,
  type RepositorioReportes,
  type RepositorioResguardo,
  type ReporteBD,
} from "@/lib/puertos";
import type { EstadoReporte } from "@/lib/tipos";

export class AlmacenFotosEnMemoria implements AlmacenFotos {
  guardadas: string[] = [];
  eliminadas: string[] = [];
  private contador = 0;

  async guardar(archivo: File): Promise<string> {
    if (!archivo.type.startsWith("image/")) {
      throw new ErrorFotoInvalida("Formato de imagen no soportado. Usa JPG, PNG o WEBP.");
    }
    const url = `/uploads/foto-${++this.contador}.jpg`;
    this.guardadas.push(url);
    return url;
  }

  async eliminar(url: string): Promise<void> {
    this.eliminadas.push(url);
  }
}

export class NotificadorEspia implements NotificadorCambios {
  avisosReportes = 0;
  avisosResguardo = 0;
  reportesCambiaron() {
    this.avisosReportes++;
  }
  resguardoCambio() {
    this.avisosResguardo++;
  }
}

export function foto(tipo = "image/jpeg", tamano = 10): File {
  return new File([new Uint8Array(tamano)], "foto.jpg", { type: tipo });
}

const AHORA = new Date("2026-03-20T12:00:00Z");

export class RepositorioReportesEnMemoria implements RepositorioReportes {
  filas = new Map<string, ReporteBD>();
  private contador = 0;

  async buscarPorId(id: string) {
    return this.filas.get(id) ?? null;
  }

  async crear(datos: DatosNuevoReporte): Promise<ReporteBD> {
    const fila: ReporteBD = {
      id: `r${++this.contador}`,
      estado: "ACTIVO",
      reencontradaEn: null,
      creadoEn: AHORA,
      actualizadoEn: AHORA,
      renovadoEn: AHORA,
      renovaciones: 0,
      ...datos,
    };
    this.filas.set(fila.id, fila);
    return fila;
  }

  async actualizar(id: string, cambios: CambiosReporte): Promise<ReporteBD> {
    const fila = { ...this.filas.get(id)!, ...cambios };
    this.filas.set(id, fila);
    return fila;
  }

  async cambiarEstado(id: string, estado: EstadoReporte, ahora: Date): Promise<ReporteBD> {
    const fila = {
      ...this.filas.get(id)!,
      estado,
      reencontradaEn: estado === "REENCONTRADA" ? ahora : null,
    };
    this.filas.set(id, fila);
    return fila;
  }

  async renovar(id: string, ahora: Date): Promise<ReporteBD> {
    const anterior = this.filas.get(id)!;
    const fila = { ...anterior, renovadoEn: ahora, renovaciones: anterior.renovaciones + 1 };
    this.filas.set(id, fila);
    return fila;
  }
}

export class RepositorioMascotasEnMemoria implements RepositorioMascotas {
  filas = new Map<string, MascotaBD>();
  private contador = 0;

  async buscarPorId(id: string) {
    return this.filas.get(id) ?? null;
  }

  async crear(datos: DatosNuevaMascota): Promise<MascotaBD> {
    const fila: MascotaBD = { id: `m${++this.contador}`, creadoEn: AHORA, ...datos };
    this.filas.set(fila.id, fila);
    return fila;
  }

  async actualizar(id: string, cambios: CambiosMascota): Promise<MascotaBD> {
    const fila = { ...this.filas.get(id)!, ...cambios };
    this.filas.set(id, fila);
    return fila;
  }
}

export class RepositorioResguardoEnMemoria implements RepositorioResguardo {
  filas = new Map<string, AnimalResguardoBD>();
  private contador = 0;

  async buscarPorId(id: string) {
    return this.filas.get(id) ?? null;
  }

  async crear(datos: DatosNuevoAnimal): Promise<AnimalResguardoBD> {
    const fila: AnimalResguardoBD = {
      id: `a${++this.contador}`,
      estado: "EN_RESGUARDO",
      entregadoEn: null,
      creadoEn: AHORA,
      ...datos,
    };
    this.filas.set(fila.id, fila);
    return fila;
  }

  async marcarEntregado(id: string, ahora: Date) {
    this.filas.set(id, { ...this.filas.get(id)!, estado: "ENTREGADO", entregadoEn: ahora });
  }

  async eliminar(id: string) {
    this.filas.delete(id);
  }
}
