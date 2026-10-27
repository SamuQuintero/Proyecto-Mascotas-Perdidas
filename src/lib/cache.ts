import { revalidateTag, unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { coincideConTexto, construirConsulta, type FiltrosReporte } from "@/lib/filtros";
import { serializarReporte, type Reporte, type TipoReporte } from "@/lib/tipos";

// Lecturas de uso común, guardadas en caché del servidor. La base de datos
// (Supabase en Canadá) tarda ~0,5 s por consulta desde Colombia, así que las
// listas que casi todas las páginas necesitan se leen una vez y se reutilizan.
// Cada escritura invalida la etiqueta correspondiente con invalidar(): el
// caché nunca muestra datos viejos tras una publicación o edición. El tiempo
// (`revalidate`) es solo una red de seguridad. Todo se guarda serializado
// (fechas como texto), que es lo que Next puede guardar en caché.

export const ETIQUETA_REPORTES = "reportes";
export const ETIQUETA_RESGUARDO = "resguardo";
export const ETIQUETA_ESTABLECIMIENTOS = "establecimientos";

const SEGURIDAD_S = 120;

export function invalidar(...etiquetas: string[]) {
  etiquetas.forEach((etiqueta) => revalidateTag(etiqueta));
}

// Reportes abiertos de un tipo: candidatos de las alertas (HU-4, HU-7,
// HU-10, HU-16, HU-20) y avisos de cercanía.
export const reportesActivosDeTipo = unstable_cache(
  async (tipo: TipoReporte): Promise<Reporte[]> =>
    (
      await prisma.reporte.findMany({
        where: { estado: "ACTIVO", tipo },
        orderBy: { creadoEn: "desc" },
      })
    ).map(serializarReporte),
  ["reportes-activos-de-tipo"],
  { tags: [ETIQUETA_REPORTES], revalidate: SEGURIDAD_S }
);

// Listado filtrado de /reportes y GET /api/reportes (HU-6). La clave de
// caché incluye los filtros.
export const reportesFiltrados = unstable_cache(
  async (filtros: FiltrosReporte): Promise<Reporte[]> => {
    const reportes = await prisma.reporte.findMany({
      where: construirConsulta(filtros),
      // HU-19: un reporte renovado vuelve a aparecer arriba.
      orderBy: { renovadoEn: "desc" },
    });
    return reportes.filter((r) => coincideConTexto(r, filtros)).map(serializarReporte);
  },
  ["reportes-filtrados"],
  { tags: [ETIQUETA_REPORTES], revalidate: SEGURIDAD_S }
);

// Un reporte por id. `cache` de React evita repetir la lectura dentro de la
// misma petición (la página y generateMetadata lo piden los dos).
const reporteEnCache = unstable_cache(
  async (id: string): Promise<Reporte | null> => {
    const reporte = await prisma.reporte.findUnique({ where: { id } });
    return reporte ? serializarReporte(reporte) : null;
  },
  ["reporte-por-id"],
  { tags: [ETIQUETA_REPORTES], revalidate: SEGURIDAD_S }
);
export const reportePorId = cache((id: string) => reporteEnCache(id));

// Portada: los más recientes y los conteos por tipo y estado.
export const resumenInicio = unstable_cache(
  async () => {
    const [recientes, conteos] = await Promise.all([
      prisma.reporte.findMany({ where: { estado: "ACTIVO" }, orderBy: { creadoEn: "desc" }, take: 6 }),
      prisma.reporte.groupBy({ by: ["tipo", "estado"], _count: { _all: true } }),
    ]);
    return { recientes: recientes.map(serializarReporte), conteos };
  },
  ["resumen-inicio"],
  { tags: [ETIQUETA_REPORTES], revalidate: SEGURIDAD_S }
);

export interface AnimalResguardoEnCache {
  id: string;
  especie: string;
  nombre: string | null;
  raza: string | null;
  color: string;
  tamano: "PEQUENO" | "MEDIANO" | "GRANDE";
  senasParticulares: string | null;
  fotoUrl: string;
  desde: string;
  refugio: { nombre: string; email: string; telefono: string | null };
}

// Animales en resguardo (HU-20), con los datos públicos de su refugio.
export const animalesEnResguardo = unstable_cache(
  async (): Promise<AnimalResguardoEnCache[]> => {
    const animales = await prisma.animalResguardo.findMany({
      where: { estado: "EN_RESGUARDO" },
      orderBy: { desde: "desc" },
      include: { refugio: true },
    });
    return animales.map((a) => ({
      id: a.id,
      especie: a.especie,
      nombre: a.nombre,
      raza: a.raza,
      color: a.color,
      tamano: a.tamano,
      senasParticulares: a.senasParticulares,
      fotoUrl: a.fotoUrl,
      desde: a.desde.toISOString(),
      refugio: {
        nombre: a.refugio.nombreRefugio || a.refugio.nombre,
        email: a.refugio.email,
        telefono: a.refugio.telefono,
      },
    }));
  },
  ["animales-en-resguardo"],
  { tags: [ETIQUETA_RESGUARDO], revalidate: SEGURIDAD_S }
);

export interface EstablecimientoEnCache {
  id: string;
  rol: "VETERINARIA" | "REFUGIO";
  nombre: string;
  telefono: string;
  direccion: string | null;
  latitud: number;
  longitud: number;
}

// Directorio "Dónde acudir" (HU-18).
export const establecimientosPublicos = unstable_cache(
  async (): Promise<EstablecimientoEnCache[]> => {
    const usuarios = await prisma.usuario.findMany({
      where: {
        recibeEncontradas: true,
        rol: { in: ["VETERINARIA", "REFUGIO"] },
        telefono: { not: null },
        latitud: { not: null },
        longitud: { not: null },
      },
      orderBy: { creadoEn: "asc" },
    });
    return usuarios.flatMap((u) => {
      if (!u.telefono || u.latitud === null || u.longitud === null) return [];
      if (u.rol !== "VETERINARIA" && u.rol !== "REFUGIO") return [];
      return [
        {
          id: u.id,
          rol: u.rol,
          nombre: (u.rol === "REFUGIO" ? u.nombreRefugio : u.nombreClinica) || u.nombre,
          telefono: u.telefono,
          direccion: u.direccion,
          latitud: u.latitud,
          longitud: u.longitud,
        },
      ];
    });
  },
  ["establecimientos-publicos"],
  { tags: [ETIQUETA_ESTABLECIMIENTOS], revalidate: SEGURIDAD_S }
);
