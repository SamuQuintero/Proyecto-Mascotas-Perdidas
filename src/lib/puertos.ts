// Puertos: lo que la lógica de la aplicación NECESITA del mundo exterior,
// expresado como interfaces (principio de inversión de dependencias, la "D"
// de SOLID). Los servicios de src/servicios/ dependen de estas interfaces y
// no de Prisma, del disco ni de Next.js; las implementaciones concretas
// ("adaptadores") viven en src/infraestructura/ y se conectan en
// src/composicion.ts.
//
//   Rutas HTTP ──► Servicios ──► Puertos (interfaces) ◄── Adaptadores
//                  (reglas)      (este archivo)           (Prisma, disco, caché)
//
// Beneficio práctico: los servicios se prueban con dobles en memoria, sin
// base de datos (ver src/servicios/*.test.ts), y cambiar de Supabase a otro
// almacenamiento de fotos o de base de datos solo toca los adaptadores.

import type {
  AnimalResguardo as AnimalResguardoBD,
  Mascota as MascotaBD,
  Reporte as ReporteBD,
} from "@prisma/client";
import type { camposMascotaParaGuardar } from "@/lib/mascotas";
import type { camposParaGuardar } from "@/lib/reportes";
import type { EstadoReporte, Tamano, TipoReporte } from "@/lib/tipos";

// Las entidades que devuelven los repositorios son las filas de la base
// (solo como tipos; no hay código de Prisma en este archivo).
export type { AnimalResguardoBD, MascotaBD, ReporteBD };

// ---------------------------------------------------------------- Fotos

// Error que lanza un almacén cuando el archivo no es válido (formato o
// tamaño). Los servicios lo traducen a un error de validación del campo.
export class ErrorFotoInvalida extends Error {}

export interface AlmacenFotos {
  // Guarda la foto y devuelve la URL con la que se mostrará.
  guardar(archivo: File): Promise<string>;
  // Borra una foto que ya no se usa. No falla si ya no existe.
  eliminar(url: string): Promise<void>;
}

// ------------------------------------------------------------ Caché / avisos

// Avisa que los datos cambiaron para que las lecturas guardadas en caché se
// vuelvan a pedir. La implementación decide cómo (etiquetas de Next, Redis…).
export interface NotificadorCambios {
  reportesCambiaron(): void;
  resguardoCambio(): void;
}

// ------------------------------------------------------------ Repositorios

export type DatosNuevoReporte = ReturnType<typeof camposParaGuardar> & {
  tipo: TipoReporte;
  fotoUrl: string;
  usuarioId: string | null;
};
export type CambiosReporte = ReturnType<typeof camposParaGuardar> & { fotoUrl: string };

export interface RepositorioReportes {
  buscarPorId(id: string): Promise<ReporteBD | null>;
  crear(datos: DatosNuevoReporte): Promise<ReporteBD>;
  actualizar(id: string, cambios: CambiosReporte): Promise<ReporteBD>;
  // `ahora` entra por parámetro: el repositorio no consulta el reloj.
  cambiarEstado(id: string, estado: EstadoReporte, ahora: Date): Promise<ReporteBD>;
  renovar(id: string, ahora: Date): Promise<ReporteBD>;
}

export type DatosNuevaMascota = ReturnType<typeof camposMascotaParaGuardar> & {
  fotoUrl: string;
  usuarioId: string | null;
};
export type CambiosMascota = ReturnType<typeof camposMascotaParaGuardar> & { fotoUrl: string };

export interface RepositorioMascotas {
  buscarPorId(id: string): Promise<MascotaBD | null>;
  crear(datos: DatosNuevaMascota): Promise<MascotaBD>;
  actualizar(id: string, cambios: CambiosMascota): Promise<MascotaBD>;
}

export interface DatosNuevoAnimal {
  refugioId: string;
  especie: string;
  nombre: string | null;
  raza: string | null;
  color: string;
  tamano: Tamano;
  senasParticulares: string | null;
  fotoUrl: string;
  desde: Date;
}

export interface RepositorioResguardo {
  buscarPorId(id: string): Promise<AnimalResguardoBD | null>;
  crear(datos: DatosNuevoAnimal): Promise<AnimalResguardoBD>;
  marcarEntregado(id: string, ahora: Date): Promise<void>;
  eliminar(id: string): Promise<void>;
}
