import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DetalleReporte from "@/components/DetalleReporte";
import { adminActual } from "@/lib/admin";
import { alertasDeReporte } from "@/lib/alertas";
import { alertasResguardoDeReportes } from "@/lib/alertasResguardo";
import { reportePorId } from "@/lib/cache";
import { textoParaCompartir, vistaPreviaReporte } from "@/lib/compartir";
import { esUrlLocal, urlAbsoluta } from "@/lib/contacto";
import { sesionGestion } from "@/lib/cuenta";
import { puedeGestionar } from "@/lib/propiedad";
import { puedeRenovar } from "@/lib/renovacion";

// HU-21: vista previa al pegar el enlace en redes (foto, título y descripción).
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const reporte = await reportePorId(params.id);
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
  // El reporte, las alertas y los animales en resguardo salen del caché del
  // servidor (ver cache.ts): la página casi no espera a la base de datos.
  const reporte = await reportePorId(params.id);

  if (!reporte) {
    notFound();
  }

  const [alertas, resguardo, sesion] = await Promise.all([
    alertasDeReporte(reporte),
    alertasResguardoDeReportes([reporte]).then((mapa) => mapa.get(reporte.id) ?? []),
    sesionGestion(),
  ]);
  const urlCompartir = urlAbsoluta(`/reportes/${reporte.id}`);

  return (
    <DetalleReporte
      reporte={reporte}
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
      resguardo={resguardo}
      puedeGestionar={puedeGestionar(reporte, sesion)}
      puedeRenovar={puedeRenovar(reporte)}
    />
  );
}
