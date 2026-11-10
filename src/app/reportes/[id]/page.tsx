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
export async function generateMetadata(
  props: {
    params: Promise<{ id: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const reporte = await reportePorId(params.id);
  if (!reporte) return {};
  const { titulo, descripcion } = vistaPreviaReporte(reporte);
  const url = await urlAbsoluta(`/reportes/${reporte.id}`);
  const urlFoto = await urlAbsoluta(reporte.fotoUrl);
  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      url,
      siteName: "PetMatch",
      type: "article",
      images: [{ url: urlFoto }],
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
      images: [urlFoto],
    },
  };
}

export default async function DetalleReportePage(
  props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ nuevo?: string; editado?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
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
  const urlCompartir = await urlAbsoluta(`/reportes/${reporte.id}`);

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
      esAdmin={(await adminActual()) !== null}
      urlCompartir={urlCompartir}
      textoCompartir={textoParaCompartir(reporte)}
      enlaceLocal={esUrlLocal(urlCompartir)}
      resguardo={resguardo}
      puedeGestionar={puedeGestionar(reporte, sesion)}
      puedeRenovar={puedeRenovar(reporte)}
    />
  );
}
