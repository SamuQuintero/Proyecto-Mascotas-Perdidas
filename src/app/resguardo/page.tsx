import Link from "next/link";
import { Home, Phone, Search } from "lucide-react";
import { enlaceTelefono } from "@/lib/contacto";
import { animalesEnResguardo } from "@/lib/cache";
import { textoResguardo } from "@/lib/resguardo";
import { contieneTexto } from "@/lib/texto";
import { ETIQUETA_TAMANO } from "@/lib/tipos";
import { ESPECIES } from "@/lib/validacion";

export const metadata = {
  title: "Animales en resguardo — PetMatch",
};

export const dynamic = "force-dynamic";

// HU-20: animales que refugios y rescatistas tienen bajo su cuidado, para
// que sus dueños los reconozcan antes de que entren en adopción.
export default async function ResguardoPage({
  searchParams,
}: {
  searchParams: { especie?: string; color?: string };
}) {
  const especie = ESPECIES.find((e) => e === searchParams.especie);
  const color = searchParams.color?.trim() ?? "";

  const animales = (await animalesEnResguardo()).filter(
    (a) => (!especie || a.especie === especie) && contieneTexto(a.color, color)
  );

  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-reencontrada-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-reencontrada-700 ring-1 ring-reencontrada-200">
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
          Refugios y rescatistas
        </p>
        <h1 className="titulo-display text-3xl">Animales en resguardo</h1>
        <p className="mt-2 text-tinta-600">
          ¿Perdiste a tu mascota? Revisa si alguno de estos animales es tuyo antes de que entre
          en adopción. Contacta directamente al refugio que lo tiene.
        </p>
      </header>

      <form method="get" className="tarjeta flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="mb-1.5 block text-sm font-semibold text-tinta-700">Especie</span>
          <select name="especie" defaultValue={especie ?? ""} className="campo-input">
            <option value="">Todas</option>
            {ESPECIES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="block flex-1">
          <span className="mb-1.5 block text-sm font-semibold text-tinta-700">Color</span>
          <input name="color" defaultValue={color} placeholder="Ej. negro, café…" className="campo-input" />
        </label>
        <button type="submit" className="boton-primario">
          <Search className="h-4 w-4" aria-hidden="true" />
          Buscar
        </button>
      </form>

      {animales.length === 0 ? (
        <div className="tarjeta px-6 py-14 text-center text-tinta-500">
          {especie || color
            ? "Ningún animal en resguardo coincide con la búsqueda."
            : "Por ahora no hay animales publicados en resguardo."}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {animales.map((animal) => (
            <li key={animal.id} className="tarjeta overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={animal.fotoUrl} alt="" className="h-48 w-full object-cover" />
              <div className="space-y-2 p-4">
                <h2 className="font-display text-lg font-bold text-tinta-900">
                  {animal.nombre || animal.especie}
                  <span className="font-sans text-sm font-medium text-tinta-400">
                    {" "}
                    · {animal.color} · {ETIQUETA_TAMANO[animal.tamano]}
                  </span>
                </h2>
                {animal.raza && <p className="text-sm text-tinta-500">{animal.raza}</p>}
                {animal.senasParticulares && (
                  <p className="text-sm text-tinta-600">{animal.senasParticulares}</p>
                )}
                <p className="rounded-xl bg-crema-100 px-3 py-2 text-xs font-semibold text-tinta-700">
                  {textoResguardo(animal.desde)}
                </p>
                <p className="text-sm font-semibold text-tinta-800">
                  {animal.refugio.nombre}
                </p>
                {animal.refugio.telefono ? (
                  <a href={enlaceTelefono(animal.refugio.telefono)} className="boton-secundario">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {animal.refugio.telefono}
                  </a>
                ) : (
                  <a href={`mailto:${animal.refugio.email}`} className="text-sm font-semibold text-perdida-600 underline">
                    {animal.refugio.email}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-sm text-tinta-500">
        ¿Eres refugio o rescatista?{" "}
        <Link href="/cuenta/registro" className="font-semibold text-perdida-600 underline">
          Crea tu cuenta
        </Link>{" "}
        para publicar a los animales que tienes.
      </p>
    </div>
  );
}
