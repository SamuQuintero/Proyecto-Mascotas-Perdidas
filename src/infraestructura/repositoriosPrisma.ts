import type { PrismaClient } from "@prisma/client";
import type {
  CambiosMascota,
  CambiosReporte,
  DatosNuevaMascota,
  DatosNuevoAnimal,
  DatosNuevoReporte,
  RepositorioMascotas,
  RepositorioReportes,
  RepositorioResguardo,
} from "@/lib/puertos";
import type { EstadoReporte } from "@/lib/tipos";

// Adaptadores de los repositorios con Prisma/PostgreSQL (Supabase). Son la
// única parte de la lógica de escritura que conoce la base de datos. El
// cliente se recibe por el constructor, no se importa.

export class RepositorioReportesPrisma implements RepositorioReportes {
  constructor(private readonly prisma: PrismaClient) {}

  buscarPorId(id: string) {
    return this.prisma.reporte.findUnique({ where: { id } });
  }

  crear(datos: DatosNuevoReporte) {
    return this.prisma.reporte.create({ data: datos });
  }

  actualizar(id: string, cambios: CambiosReporte) {
    return this.prisma.reporte.update({ where: { id }, data: cambios });
  }

  cambiarEstado(id: string, estado: EstadoReporte, ahora: Date) {
    return this.prisma.reporte.update({
      where: { id },
      data: { estado, reencontradaEn: estado === "REENCONTRADA" ? ahora : null },
    });
  }

  renovar(id: string, ahora: Date) {
    return this.prisma.reporte.update({
      where: { id },
      data: { renovadoEn: ahora, renovaciones: { increment: 1 } },
    });
  }
}

export class RepositorioMascotasPrisma implements RepositorioMascotas {
  constructor(private readonly prisma: PrismaClient) {}

  buscarPorId(id: string) {
    return this.prisma.mascota.findUnique({ where: { id } });
  }

  crear(datos: DatosNuevaMascota) {
    return this.prisma.mascota.create({ data: datos });
  }

  actualizar(id: string, cambios: CambiosMascota) {
    return this.prisma.mascota.update({ where: { id }, data: cambios });
  }
}

export class RepositorioResguardoPrisma implements RepositorioResguardo {
  constructor(private readonly prisma: PrismaClient) {}

  buscarPorId(id: string) {
    return this.prisma.animalResguardo.findUnique({ where: { id } });
  }

  crear(datos: DatosNuevoAnimal) {
    return this.prisma.animalResguardo.create({ data: datos });
  }

  async marcarEntregado(id: string, ahora: Date) {
    await this.prisma.animalResguardo.update({
      where: { id },
      data: { estado: "ENTREGADO", entregadoEn: ahora },
    });
  }

  async eliminar(id: string) {
    await this.prisma.animalResguardo.delete({ where: { id } });
  }
}
