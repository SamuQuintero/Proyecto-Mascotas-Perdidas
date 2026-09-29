import Link from "next/link";
import { ArrowRight, Printer, QrCode, ScanLine, Smartphone } from "lucide-react";
import MisMascotas from "@/components/MisMascotas";

export const metadata = {
  title: "Placa con QR — PetMatch",
};

const PASOS = [
  {
    Icono: QrCode,
    titulo: "Crea su perfil",
    texto: "Foto, nombre, señas y tu teléfono. Una sola vez y sin crear cuenta.",
  },
  {
    Icono: Printer,
    titulo: "Imprime la placa",
    texto: "Recorta el QR y ponlo en su collar o en una placa plástica.",
  },
  {
    Icono: ScanLine,
    titulo: "Quien la encuentre, lo escanea",
    texto: "Con la cámara del celular verá su perfil y podrá llamarte o escribirte por WhatsApp.",
  },
];

// HU-8: entrada a los perfiles digitales con código QR.
export default function MascotasPage() {
  return (
    <div className="space-y-14">
      <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="animate-aparecer space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-perdida-600 ring-1 ring-perdida-100">
            <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
            Placa digital
          </p>
          <h1 className="titulo-display text-4xl leading-tight sm:text-5xl">
            Que siempre sepan <span className="texto-degradado">cómo traerla a casa.</span>
          </h1>
          <p className="max-w-xl text-lg text-tinta-500">
            Aunque no tenga microchip, un código QR en su collar lleva a quien la
            encuentre directo a tus datos de contacto.
          </p>
          <Link
            href="/mascotas/nueva"
            className="boton bg-gradient-to-r from-perdida-500 to-reencontrada-500 px-7 py-4 text-base text-white shadow-brillo hover:-translate-y-1 focus-visible:ring-perdida-200"
          >
            Crear su placa gratis
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-xs" aria-hidden="true">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-perdida-200 via-sol-200 to-reencontrada-200 opacity-70 blur-2xl" />
          <div className="relative animate-flotar rounded-[2.5rem] bg-white p-6 text-center shadow-elevada [--giro:-4deg]">
            <div className="mx-auto grid h-40 w-40 grid-cols-5 gap-1.5 rounded-2xl bg-tinta-900 p-4">
              {Array.from({ length: 25 }).map((_, i) => (
                <span
                  key={i}
                  className={`rounded-sm ${[0, 1, 3, 5, 6, 8, 12, 14, 16, 18, 19, 20, 22, 24].includes(i) ? "bg-white" : "bg-tinta-900"}`}
                />
              ))}
            </div>
            <p className="mt-4 font-display text-xl font-bold text-tinta-900">¡Hola! Soy Toby</p>
            <p className="flex items-center justify-center gap-1.5 text-sm text-tinta-500">
              <Smartphone className="h-4 w-4" />
              Escanéame si me encontraste
            </p>
          </div>
        </div>
      </section>

      <MisMascotas />

      <ol className="grid gap-5 md:grid-cols-3">
        {PASOS.map(({ Icono, titulo, texto }, indice) => (
          <li key={titulo} className="tarjeta p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tinta-900 text-white">
              <Icono className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-tinta-400">
              Paso {indice + 1}
            </p>
            <h2 className="titulo-display text-lg">{titulo}</h2>
            <p className="mt-1 text-tinta-500">{texto}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
