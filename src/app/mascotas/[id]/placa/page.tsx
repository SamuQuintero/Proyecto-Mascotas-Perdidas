import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { CircleCheckBig, Download, Eye, PawPrint, TriangleAlert } from "lucide-react";
import BotonImprimir from "./BotonImprimir";
import { prisma } from "@/lib/db";
import { esUrlLocal, urlAbsoluta } from "@/lib/contacto";

export const metadata = {
  title: "Placa con QR — PetMatch",
};

// HU-8: placa imprimible con el código QR que lleva al perfil de la mascota.
// Al imprimir solo sale la placa (el resto de la página se oculta).
export default async function PlacaMascotaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { nuevo?: string };
}) {
  const mascota = await prisma.mascota.findUnique({ where: { id: params.id } });
  if (!mascota) notFound();

  const urlPerfil = urlAbsoluta(`/mascotas/${mascota.id}`);
  const opciones = { margin: 1, errorCorrectionLevel: "M" as const, color: { dark: "#1C1829", light: "#FFFFFF" } };
  const [svgQr, pngQr] = await Promise.all([
    QRCode.toString(urlPerfil, { ...opciones, type: "svg" }),
    QRCode.toDataURL(urlPerfil, { ...opciones, width: 1024 }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {searchParams.nuevo === "true" && (
        <div
          role="status"
          className="flex animate-aparecer items-center gap-3 rounded-2xl border border-encontrada-200 bg-encontrada-50 px-4 py-3 text-sm font-semibold text-encontrada-800 print:hidden"
        >
          <CircleCheckBig className="h-5 w-5 shrink-0" aria-hidden="true" />
          ¡Perfil de {mascota.nombre} creado! Imprime la placa y ponla en su collar.
        </div>
      )}

      <div className="print:hidden">
        <h1 className="titulo-display text-3xl sm:text-4xl">La placa de {mascota.nombre}</h1>
        <p className="mt-2 text-tinta-500">
          Imprímela, recórtala y ponla en su collar. Al escanearla se abre su
          perfil con tus datos de contacto.
        </p>
      </div>

      {esUrlLocal(urlPerfil) && (
        <p className="flex items-start gap-3 rounded-2xl border border-sol-200 bg-sol-100 px-4 py-3 text-sm text-tinta-700 print:hidden">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-sol-500" aria-hidden="true" />
          <span>
            Este QR apunta a <strong>{urlPerfil}</strong>, que solo funciona en este
            computador. Para que funcione al escanearlo desde otro celular, publica la
            aplicación y define <code className="font-semibold">URL_PUBLICA</code> en el
            archivo <code className="font-semibold">.env</code>.
          </span>
        </p>
      )}

      <div className="grid items-start gap-6 md:grid-cols-[auto_1fr]">
        {/* La placa: esto es lo único que se imprime. */}
        <div className="placa-imprimible mx-auto w-72 overflow-hidden rounded-[2rem] border-4 border-tinta-900 bg-white text-center shadow-elevada print:shadow-none">
          <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-perdida-500 to-reencontrada-500 px-4 py-3 text-white">
            <PawPrint className="h-5 w-5" aria-hidden="true" />
            <span className="font-display text-lg font-extrabold">¡Hola! Soy {mascota.nombre}</span>
          </div>
          <div
            className="mx-auto w-56 p-2 [&_svg]:h-auto [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svgQr }}
          />
          <p className="px-4 pb-1 text-sm font-bold text-tinta-900">Si me encontraste, escanéame</p>
          <p className="px-4 pb-4 text-xs text-tinta-500">
            o llama a mi familia: <strong className="text-tinta-800">{mascota.contactoTelefono}</strong>
          </p>
        </div>

        <div className="space-y-3 print:hidden">
          <BotonImprimir />
          <a
            href={pngQr}
            download={`placa-qr-${mascota.nombre.toLowerCase().replace(/\s+/g, "-")}.png`}
            className="boton-secundario w-full py-3.5"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Descargar QR (imagen)
          </a>
          <Link href={`/mascotas/${mascota.id}`} className="boton-secundario w-full py-3.5">
            <Eye className="h-4 w-4" aria-hidden="true" />
            Ver su perfil
          </Link>
          <p className="rounded-2xl bg-crema-100 p-4 text-xs text-tinta-600">
            Consejo: plastifica la placa o pégala con cinta transparente para
            protegerla del agua. Guarda este enlace para volver a imprimirla.
          </p>
        </div>
      </div>
    </div>
  );
}
