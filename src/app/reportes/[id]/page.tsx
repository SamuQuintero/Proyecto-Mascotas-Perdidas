import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import DetalleReporte from "@/components/DetalleReporte";
import type { Reporte } from "@/lib/tipos";

export default async function DetalleReportePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { nuevo?: string };
}) {
  const reporte = await prisma.reporte.findUnique({
    where: { id: params.id },
  });

  if (!reporte) {
    notFound();
  }

  return (
    <DetalleReporte
      reporte={reporte as unknown as Reporte}
      esNuevo={searchParams.nuevo === "true"}
    />
  );
}
