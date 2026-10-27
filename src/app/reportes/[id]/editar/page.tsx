import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import FormularioReporte from "@/components/FormularioReporte";
import { sesionGestion } from "@/lib/cuenta";
import { puedeGestionar } from "@/lib/propiedad";
import { serializarReporte } from "@/lib/tipos";

export const metadata = {
  title: "Editar reporte — PetMatch",
};

// HU-25 / HU-23: edición de un reporte existente (administrador o su dueño).
export default async function EditarReportePage({
  params,
}: {
  params: { id: string };
}) {
  const reporte = await prisma.reporte.findUnique({
    where: { id: params.id },
  });
  if (!reporte) {
    notFound();
  }

  const sesion = await sesionGestion();
  if (!puedeGestionar(reporte, sesion)) {
    // Sin sesión se pide iniciarla; con una sesión ajena, el reporte no es suyo.
    if (!sesion.esAdmin && sesion.usuarioId === null) {
      redirect(`/cuenta/login?siguiente=/reportes/${params.id}/editar`);
    }
    redirect(`/reportes/${params.id}`);
  }

  const serializado = serializarReporte(reporte);
  return <FormularioReporte tipo={serializado.tipo} reporteInicial={serializado} />;
}
