import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import FormularioReporte from "@/components/FormularioReporte";
import { adminActual } from "@/lib/admin";
import { serializarReporte } from "@/lib/tipos";

export const metadata = {
  title: "Editar reporte — PetMatch",
};

// HU-25: edición de un reporte existente (solo administrador).
export default async function EditarReportePage({
  params,
}: {
  params: { id: string };
}) {
  if (!adminActual()) {
    redirect(`/admin/login?siguiente=/reportes/${params.id}/editar`);
  }

  const reporte = await prisma.reporte.findUnique({
    where: { id: params.id },
  });
  if (!reporte) {
    notFound();
  }

  const serializado = serializarReporte(reporte);
  return <FormularioReporte tipo={serializado.tipo} reporteInicial={serializado} />;
}
