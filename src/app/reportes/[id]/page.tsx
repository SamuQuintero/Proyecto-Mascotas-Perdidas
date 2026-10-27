import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import DetalleReporte from "@/components/DetalleReporte";
import { adminActual } from "@/lib/admin";
import { alertasDeReporte } from "@/lib/alertas";
import { sesionGestion } from "@/lib/cuenta";
import { puedeGestionar } from "@/lib/propiedad";
import { puedeRenovar } from "@/lib/renovacion";
import { serializarReporte } from "@/lib/tipos";

export default async function DetalleReportePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { nuevo?: string; editado?: string };
}) {
  const reporte = await prisma.reporte.findUnique({
    where: { id: params.id },
  });

  if (!reporte) {
    notFound();
  }

  const serializado = serializarReporte(reporte);
  const alertas = await alertasDeReporte(serializado);
  const gestiona = puedeGestionar(reporte, await sesionGestion());

  return (
    <DetalleReporte
      reporte={serializado}
      alertas={alertas}
      aviso={
        searchParams.nuevo === "true"
          ? "nuevo"
          : searchParams.editado === "true"
            ? "editado"
            : null
      }
      esAdmin={adminActual() !== null}
      puedeGestionar={gestiona}
      puedeRenovar={puedeRenovar(reporte)}
    />
  );
}
