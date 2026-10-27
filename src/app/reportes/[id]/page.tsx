import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import DetalleReporte from "@/components/DetalleReporte";
import { adminActual } from "@/lib/admin";
import { alertasDeReporte } from "@/lib/alertas";
import { sesionGestion } from "@/lib/cuenta";
import { puedeGestionar } from "@/lib/propiedad";
import { puedeRenovar } from "@/lib/renovacion";
import { urlAbsoluta, esUrlLocal } from "@/lib/contacto";
import { textoParaCompartir, vistaPreviaReporte } from "@/lib/compartir";
import { serializarReporte } from "@/lib/tipos";

// HU-21: vista previa al pegar el enlace en redes (foto, título y descripción).
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const reporte = await prisma.reporte.findUnique({ where: { id: params.id } });
  if (!reporte) return {};
  const { titulo, descripcion } = vistaPreviaReporte(reporte);
  const url = urlAbsoluta(`/reportes/${reporte.id}`);
  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      url,
      siteName: "PetMatch",
      type: "article",
      images: [{ url: urlAbsoluta(reporte.fotoUrl) }],
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
      images: [urlAbsoluta(reporte.fotoUrl)],
    },
  };
}

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

  const urlCompartir = urlAbsoluta(`/reportes/${reporte.id}`);

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
      urlCompartir={urlCompartir}
      textoCompartir={textoParaCompartir(reporte)}
      enlaceLocal={esUrlLocal(urlCompartir)}
      puedeGestionar={gestiona}
      puedeRenovar={puedeRenovar(reporte)}
    />
  );
}
