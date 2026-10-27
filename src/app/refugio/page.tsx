import Link from "next/link";
import { redirect } from "next/navigation";
import { Home } from "lucide-react";
import AccionesResguardo from "@/components/AccionesResguardo";
import BotonCerrarSesionCuenta from "@/components/BotonCerrarSesionCuenta";
import FormularioResguardo from "@/components/FormularioResguardo";
import PerfilEstablecimiento from "@/components/PerfilEstablecimiento";
import { usuarioActual } from "@/lib/cuenta";
import { prisma } from "@/lib/db";
import { textoResguardo } from "@/lib/resguardo";
import { ETIQUETA_TAMANO } from "@/lib/tipos";
import { rutaPanel } from "@/lib/roles";

export const metadata = {
  title: "Panel del refugio — PetMatch",
};

// HU-20: panel del refugio o rescatista. Publica los animales que tiene
// bajo resguardo (y desde cuándo) y gestiona los que ya entregó.
export default async function RefugioPage() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/cuenta/login?siguiente=/refugio");
  if (usuario.rol !== "REFUGIO") redirect(rutaPanel(usuario.rol));

  const animales = await prisma.animalResguardo.findMany({
    where: { refugioId: usuario.id },
    orderBy: [{ estado: "asc" }, { desde: "desc" }],
  });
  const enResguardo = animales.filter((a) => a.estado === "EN_RESGUARDO");
  const entregados = animales.filter((a) => a.estado === "ENTREGADO");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-reencontrada-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-reencontrada-700 ring-1 ring-reencontrada-200">
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            {usuario.nombreRefugio || "Refugio"}
          </p>
          <h1 className="titulo-display text-3xl">Hola, {usuario.nombre}</h1>
          <p className="mt-1 text-sm text-tinta-500">
            Publica los animales que tienes bajo resguardo para que sus dueños puedan
            reconocerlos antes de que entren en adopción.{" "}
            <Link href="/resguardo" className="font-semibold text-perdida-600 underline">
              Ver el listado público
            </Link>
          </p>
        </div>
        <BotonCerrarSesionCuenta />
      </header>

      <section className="tarjeta p-6">
        <h2 className="mb-4 font-display text-xl font-bold">Publicar un animal</h2>
        <FormularioResguardo />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">En resguardo ({enResguardo.length})</h2>
        {enResguardo.length === 0 ? (
          <div className="tarjeta px-6 py-10 text-center text-tinta-500">
            Todavía no has publicado animales.
          </div>
        ) : (
          <ul className="space-y-3">
            {enResguardo.map((animal) => (
              <li key={animal.id} className="tarjeta flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={animal.fotoUrl} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-bold text-tinta-900">
                    {animal.nombre || animal.especie}
                    <span className="font-sans text-sm font-medium text-tinta-400">
                      {" "}
                      · {animal.color} · {ETIQUETA_TAMANO[animal.tamano]}
                    </span>
                  </p>
                  <p className="text-sm text-tinta-500">{textoResguardo(animal.desde)}</p>
                </div>
                <AccionesResguardo id={animal.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {entregados.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold text-tinta-600">
            Entregados ({entregados.length})
          </h2>
          <ul className="space-y-2">
            {entregados.map((animal) => (
              <li key={animal.id} className="flex items-center gap-3 rounded-2xl bg-crema-100 p-3 text-sm text-tinta-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={animal.fotoUrl} alt="" className="h-10 w-10 rounded-xl object-cover grayscale" />
                <span className="flex-1 truncate font-semibold">
                  {animal.nombre || animal.especie} · {animal.color}
                </span>
                <AccionesResguardo id={animal.id} entregado />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="tarjeta p-6">
        <h2 className="mb-1 font-display text-xl font-bold">Directorio “Dónde acudir”</h2>
        <p className="mb-4 text-sm text-tinta-500">
          Si también recibes mascotas encontradas, actívalo: quien halle un animal verá tu
          teléfono y ubicación. Tu teléfono es además el contacto de tus animales en resguardo.
        </p>
        <PerfilEstablecimiento
          inicial={{
            telefono: usuario.telefono,
            direccion: usuario.direccion,
            latitud: usuario.latitud,
            longitud: usuario.longitud,
            recibeEncontradas: usuario.recibeEncontradas,
          }}
        />
      </section>
    </div>
  );
}
