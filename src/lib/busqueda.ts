import { prisma } from "@/lib/db";
import { coincideConTexto, construirConsulta, type FiltrosReporte } from "@/lib/filtros";
import { serializarReporte, type Reporte } from "@/lib/tipos";

// HU-6: búsqueda de reportes. Los filtros exactos (tipo, estado, especie,
// tamaño, fechas) los resuelve la base de datos; los de texto libre (zona,
// color) se aplican después, normalizando tildes y mayúsculas.
export async function buscarReportes(filtros: FiltrosReporte): Promise<Reporte[]> {
  const reportes = await prisma.reporte.findMany({
    where: construirConsulta(filtros),
    orderBy: { creadoEn: "desc" },
  });
  return reportes
    .filter((reporte) => coincideConTexto(reporte, filtros))
    .map(serializarReporte);
}
