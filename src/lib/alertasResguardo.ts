import { calcularAlertasResguardo, type ReporteComparable } from "@/lib/coincidencias";
import { prisma } from "@/lib/db";

// HU-20: animales en resguardo que se parecen a una mascota perdida. Solo
// las pérdidas abiertas generan alertas; solo cuentan los animales que
// siguen en resguardo (no los ya entregados).

export interface AlertaResguardoPublica {
  id: string;
  titulo: string;
  especie: string;
  color: string;
  fotoUrl: string;
  desde: string;
  puntaje: number;
  razones: string[];
  refugio: string;
  telefono: string | null;
}

const MAXIMO_REPORTES = 20;

export async function alertasResguardoDeReportes(
  reportes: (ReporteComparable & { estado: string })[]
): Promise<Map<string, AlertaResguardoPublica[]>> {
  const abiertas = reportes
    .filter((r) => r.tipo === "PERDIDA" && r.estado === "ACTIVO")
    .slice(0, MAXIMO_REPORTES);
  const resultado = new Map<string, AlertaResguardoPublica[]>();
  if (abiertas.length === 0) return resultado;

  const animales = await prisma.animalResguardo.findMany({
    where: { estado: "EN_RESGUARDO" },
    include: { refugio: true },
  });

  for (const reporte of abiertas) {
    resultado.set(
      reporte.id,
      calcularAlertasResguardo(reporte, animales).map(({ animal, puntaje, razones }) => ({
        id: animal.id,
        titulo: animal.nombre || animal.especie,
        especie: animal.especie,
        color: animal.color,
        fotoUrl: animal.fotoUrl,
        desde: animal.desde.toISOString(),
        puntaje,
        razones,
        refugio: animal.refugio.nombreRefugio || animal.refugio.nombre,
        telefono: animal.refugio.telefono,
      }))
    );
  }
  return resultado;
}
