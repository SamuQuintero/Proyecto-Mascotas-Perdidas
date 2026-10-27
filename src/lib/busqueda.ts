import { reportesFiltrados } from "@/lib/cache";
import type { FiltrosReporte } from "@/lib/filtros";
import type { Reporte } from "@/lib/tipos";

// HU-6: búsqueda de reportes. Los filtros exactos (tipo, estado, especie,
// tamaño, fechas) los resuelve la base de datos; los de texto libre (zona,
// color) se aplican después, normalizando tildes y mayúsculas. El resultado
// va en caché (ver cache.ts) y se invalida al publicar o editar reportes.
export async function buscarReportes(filtros: FiltrosReporte): Promise<Reporte[]> {
  return reportesFiltrados(filtros);
}
