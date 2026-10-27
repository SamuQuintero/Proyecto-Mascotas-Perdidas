import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import ListaEstablecimientos, {
  type EstablecimientoPublico,
} from "@/components/ListaEstablecimientos";
import { establecimientosPublicos } from "@/lib/cache";
import { enlaceTelefono, enlaceWhatsApp } from "@/lib/contacto";

export const metadata = {
  title: "Dónde acudir con una mascota encontrada — PetMatch",
};

// HU-18: directorio de veterinarias y refugios que reciben mascotas
// encontradas, para quien halla un animal y no puede quedarse con él. La
// lista va en caché y se invalida cuando un local cambia su perfil.
export default async function DondeAcudirPage() {
  const establecimientos: EstablecimientoPublico[] = (await establecimientosPublicos()).map(
    ({ rol, ...e }) => ({
      ...e,
      tipo: rol,
      enlaceTelefono: enlaceTelefono(e.telefono),
      enlaceWhatsApp: enlaceWhatsApp(e.telefono),
    })
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-encontrada-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-encontrada-700 ring-1 ring-encontrada-200">
          <HeartHandshake className="h-3.5 w-3.5" aria-hidden="true" />
          Para quien encontró una mascota
        </p>
        <h1 className="titulo-display text-3xl">Dónde acudir</h1>
        <p className="mt-2 text-tinta-600">
          ¿Encontraste un animal y no puedes quedarte con él? Estas veterinarias y refugios de
          la zona reciben mascotas encontradas. Llama antes de ir para confirmar que tienen
          cupo. Cuando lo entregues, no olvides{" "}
          <Link href="/encontrada/nuevo" className="font-semibold text-perdida-600 underline">
            publicar el hallazgo
          </Link>{" "}
          para que su familia pueda encontrarlo.
        </p>
      </header>

      <ListaEstablecimientos establecimientos={establecimientos} />
    </div>
  );
}
