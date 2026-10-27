import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import ListaEstablecimientos, {
  type EstablecimientoPublico,
} from "@/components/ListaEstablecimientos";
import { enlaceTelefono, enlaceWhatsApp } from "@/lib/contacto";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Dónde acudir con una mascota encontrada — PetMatch",
};

// Las cuentas editan su perfil y deben verse al instante en el directorio.
export const dynamic = "force-dynamic";

// HU-18: directorio de veterinarias y refugios que reciben mascotas
// encontradas, para quien halla un animal y no puede quedarse con él.
export default async function DondeAcudirPage() {
  const usuarios = await prisma.usuario.findMany({
    where: {
      recibeEncontradas: true,
      rol: { in: ["VETERINARIA", "REFUGIO"] },
      telefono: { not: null },
      latitud: { not: null },
      longitud: { not: null },
    },
    orderBy: { creadoEn: "asc" },
  });

  const establecimientos: EstablecimientoPublico[] = usuarios.flatMap((u) => {
    // Los filtros de la consulta garantizan estos datos; se revisa para el tipado.
    if (!u.telefono || u.latitud === null || u.longitud === null) return [];
    if (u.rol !== "VETERINARIA" && u.rol !== "REFUGIO") return [];
    return [
      {
        id: u.id,
        tipo: u.rol,
        nombre: (u.rol === "REFUGIO" ? u.nombreRefugio : u.nombreClinica) || u.nombre,
        telefono: u.telefono,
        direccion: u.direccion,
        latitud: u.latitud,
        longitud: u.longitud,
        enlaceTelefono: enlaceTelefono(u.telefono),
        enlaceWhatsApp: enlaceWhatsApp(u.telefono),
      },
    ];
  });

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
