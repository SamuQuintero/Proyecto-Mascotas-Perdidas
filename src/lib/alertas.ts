import { prisma } from "@/lib/db";
import { calcularAlertas, type Alerta } from "@/lib/coincidencias";
import { serializarReporte, type Reporte } from "@/lib/tipos";

// Consulta los reportes abiertos del tipo contrario y calcula las alertas
// (HU-4 coincidencias, HU-7 cercanía) de uno o varios reportes. Solo los
// casos abiertos generan alertas: un reporte reencontrado ya no las necesita
// ni aparece como candidato.

const MAXIMO_REPORTES_POR_CONSULTA = 30;

export type AlertaReporte = Alerta<Reporte>;

export async function alertasDeReporte(reporte: Reporte): Promise<AlertaReporte[]> {
  if (reporte.estado !== "ACTIVO") return [];
  const resultado = await alertasDeReportes([reporte]);
  return resultado.get(reporte.id) ?? [];
}

export async function alertasDeReportes(
  reportes: Reporte[]
): Promise<Map<string, AlertaReporte[]>> {
  const abiertos = reportes
    .filter((r) => r.estado === "ACTIVO")
    .slice(0, MAXIMO_REPORTES_POR_CONSULTA);
  const resultado = new Map<string, AlertaReporte[]>();
  if (abiertos.length === 0) return resultado;

  const tipos = Array.from(new Set(abiertos.map((r) => r.tipo)));
  const candidatos = (
    await prisma.reporte.findMany({
      where: {
        estado: "ACTIVO",
        tipo: { in: tipos.map((t) => (t === "PERDIDA" ? "ENCONTRADA" : "PERDIDA")) },
      },
      orderBy: { creadoEn: "desc" },
    })
  ).map(serializarReporte);

  for (const reporte of abiertos) {
    resultado.set(reporte.id, calcularAlertas(reporte, candidatos));
  }
  return resultado;
}
