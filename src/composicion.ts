// Raíz de composición: el ÚNICO lugar donde se eligen las implementaciones
// concretas de los puertos y se arman los servicios. Las rutas importan los
// servicios de aquí; los servicios solo conocen interfaces.
//
// Para cambiar de proveedor (otro almacén de fotos, otra base de datos) se
// cambia una línea de este archivo.

import { prisma } from "@/lib/db";
import { AlmacenFotosDisco } from "@/infraestructura/almacenFotosDisco";
import { AlmacenFotosSupabase } from "@/infraestructura/almacenFotosSupabase";
import { NotificadorCacheNext } from "@/infraestructura/notificadorCacheNext";
import {
  RepositorioMascotasPrisma,
  RepositorioReportesPrisma,
  RepositorioResguardoPrisma,
} from "@/infraestructura/repositoriosPrisma";
import { ServicioMascotas } from "@/servicios/servicioMascotas";
import { ServicioReportes } from "@/servicios/servicioReportes";
import { ServicioResguardo } from "@/servicios/servicioResguardo";

// En producción (Vercel no tiene disco persistente) las fotos van a Supabase
// Storage; sin esas variables se usa el disco local (desarrollo).
const fotos =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ? new AlmacenFotosSupabase(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : new AlmacenFotosDisco();
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
