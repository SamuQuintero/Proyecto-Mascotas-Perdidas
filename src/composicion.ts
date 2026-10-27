// Raíz de composición: el ÚNICO lugar donde se eligen las implementaciones
// concretas de los puertos y se arman los servicios. Las rutas importan los
// servicios de aquí; los servicios solo conocen interfaces.
//
// Para cambiar de proveedor (otro almacén de fotos, otra base de datos) se
// cambia una línea de este archivo.

import { prisma } from "@/lib/db";
import { AlmacenFotosDisco } from "@/infraestructura/almacenFotosDisco";
import { NotificadorCacheNext } from "@/infraestructura/notificadorCacheNext";
import {
  RepositorioMascotasPrisma,
  RepositorioReportesPrisma,
  RepositorioResguardoPrisma,
} from "@/infraestructura/repositoriosPrisma";
import { ServicioMascotas } from "@/servicios/servicioMascotas";
import { ServicioReportes } from "@/servicios/servicioReportes";
import { ServicioResguardo } from "@/servicios/servicioResguardo";

const fotos = new AlmacenFotosDisco();
const cambios = new NotificadorCacheNext();

export const servicioReportes = new ServicioReportes(
  new RepositorioReportesPrisma(prisma),
  fotos,
  cambios
);

export const servicioMascotas = new ServicioMascotas(new RepositorioMascotasPrisma(prisma), fotos);

export const servicioResguardo = new ServicioResguardo(
  new RepositorioResguardoPrisma(prisma),
  fotos,
  cambios
);
