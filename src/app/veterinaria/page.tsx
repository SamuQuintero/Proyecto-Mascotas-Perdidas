import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Eye,
  Files,
  HeartHandshake,
  PawPrint,
  Search,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import BotonCerrarSesionCuenta from "@/components/BotonCerrarSesionCuenta";
import { EtiquetaEstado, EtiquetaTipo } from "@/components/Etiquetas";
import FilaMascotaVacunas from "@/components/FilaMascotaVacunas";
import PerfilEstablecimiento from "@/components/PerfilEstablecimiento";
import { usuarioActual } from "@/lib/cuenta";
import { prisma } from "@/lib/db";
import { rutaPanel } from "@/lib/roles";
import { formatearFechaHora } from "@/lib/formato";
import { contieneTexto } from "@/lib/texto";

export const metadata = {
  title: "Panel veterinaria — PetMatch",
};

// HU-17: panel de la veterinaria. Tiene la misma vista de reportes que el
// admin (los mismos indicadores y el mismo listado), pero de solo lectura
// — sin editar, sin marcar reencontrada. A cambio, puede buscar mascotas
// con perfil QR (HU-8) y llevarles el carnet de vacunas.
export default async function VeterinariaPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() ?? "";

  // El usuario y los datos del panel se piden a la vez (ver /cuenta).
  const [usuario, reportes, conteos, mascotas] = await Promise.all([
    usuarioActual(),
    prisma.reporte.findMany({ orderBy: { creadoEn: "desc" }, take: 50 }),
    prisma.reporte.groupBy({ by: ["tipo", "estado"], _count: { _all: true } }),
    prisma.mascota.findMany({
      orderBy: { creadoEn: "desc" },
      include: { vacunas: { orderBy: { fecha: "desc" } } },
    }),
  ]);
  if (!usuario) redirect("/cuenta/login?siguiente=/veterinaria");
  if (usuario.rol !== "VETERINARIA") redirect(rutaPanel(usuario.rol));

  const contar = (filtro: (c: (typeof conteos)[number]) => boolean) =>
    conteos.filter(filtro).reduce((total, c) => total + c._count._all, 0);

  const estadisticas = [
    { etiqueta: "Reportes totales", valor: contar(() => true), Icono: Files, clase: "from-tinta-700 to-tinta-900" },
    {
      etiqueta: "Perdidas sin encontrar",
      valor: contar((c) => c.tipo === "PERDIDA" && c.estado === "ACTIVO"),
      Icono: Search,
      clase: "from-perdida-400 to-perdida-600",
    },
    {
      etiqueta: "Hallazgos abiertos",
      valor: contar((c) => c.tipo === "ENCONTRADA" && c.estado === "ACTIVO"),
      Icono: HeartHandshake,
      clase: "from-encontrada-400 to-encontrada-600",
    },
    {
      etiqueta: "Reencontradas",
      valor: contar((c) => c.estado === "REENCONTRADA"),
      Icono: Sparkles,
      clase: "from-reencontrada-400 to-reencontrada-600",
    },
  ];

  const mascotasFiltradas = mascotas.filter(
    (m) => !q || contieneTexto(m.nombre, q) || contieneTexto(m.especie, q)
  );

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-encontrada-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-encontrada-700 ring-1 ring-encontrada-200">
            <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
            {usuario.nombreClinica || "Veterinaria"}
          </p>
          <h1 className="titulo-display text-3xl">Hola, {usuario.nombre}</h1>
          <p className="mt-1 text-sm text-tinta-500">
            Puedes ver todos los reportes y llevar el carnet de vacunas de las mascotas
            registradas. No puedes editar ni cerrar reportes: eso solo lo hace el equipo
            administrador.
          </p>
        </div>
        <BotonCerrarSesionCuenta />
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Resumen">
        {estadisticas.map(({ etiqueta, valor, Icono, clase }, indice) => (
          <div key={etiqueta} className="tarjeta animate-aparecer p-5" style={{ animationDelay: `${indice * 70}ms` }}>
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${clase}`}>
              <Icono className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 font-display text-3xl font-extrabold text-tinta-900">{valor}</p>
            <p className="text-sm font-medium text-tinta-500">{etiqueta}</p>
          </div>
        ))}
      </section>

      <section className="tarjeta p-6">
        <h2 className="mb-1 font-display text-xl font-bold">Directorio “Dónde acudir”</h2>
        <p className="mb-4 text-sm text-tinta-500">
          Si tu veterinaria recibe mascotas encontradas, actívalo y quien halle un animal
          verá tu teléfono y ubicación.
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

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">Carnet de vacunas</h2>
        <form method="get" className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-400" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar mascota por nombre o especie…"
            className="campo-input pl-11"
          />
        </form>

        {mascotasFiltradas.length === 0 ? (
          <div className="tarjeta px-6 py-10 text-center text-tinta-500">
            {q ? "Ninguna mascota coincide con la búsqueda." : "Todavía no hay mascotas con perfil QR registradas."}
          </div>
        ) : (
          <ul className="space-y-3">
            {mascotasFiltradas.map((mascota) => (
              <li key={mascota.id} className="tarjeta p-4">
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mascota.fotoUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-bold text-tinta-900">
                      {mascota.nombre}
                      <span className="font-sans text-sm font-medium text-tinta-400">
                        {" "}
                        · {mascota.especie}
                        {mascota.raza ? ` · ${mascota.raza}` : ""}
                      </span>
                    </p>
                    <p className="truncate text-sm text-tinta-500">{mascota.color}</p>
                  </div>
                  <Link
                    href={`/mascotas/${mascota.id}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-tinta-200 bg-white px-3 py-1.5 text-xs font-bold text-tinta-600 transition hover:border-tinta-300"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    Ver perfil
                  </Link>
                </div>
                <div className="mt-3">
                  <FilaMascotaVacunas
                    mascotaId={mascota.id}
                    vacunas={mascota.vacunas.map((v) => ({
                      id: v.id,
                      nombre: v.nombre,
                      fecha: v.fecha.toISOString(),
                      veterinaria: v.veterinaria,
                    }))}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">Reportes (solo lectura)</h2>
        {reportes.length === 0 ? (
          <div className="tarjeta px-6 py-14 text-center text-tinta-500">
            No hay reportes todavía.
          </div>
        ) : (
          <ul className="tarjeta divide-y divide-tinta-100 overflow-hidden">
            {reportes.map((reporte) => (
              <li
                key={reporte.id}
                className="flex flex-col gap-3 p-4 transition hover:bg-crema-50 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={reporte.fotoUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-display font-bold text-tinta-900">
                      {reporte.nombre || reporte.especie}
                      <span className="font-sans text-sm font-medium text-tinta-400"> · {reporte.color}</span>
                    </p>
                    <p className="truncate text-sm text-tinta-500">
                      {reporte.zona} · {formatearFechaHora(reporte.fecha, "corta")}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <EtiquetaTipo tipo={reporte.tipo} />
                      <EtiquetaEstado estado={reporte.estado} />
                    </div>
                  </div>
                </div>
                <Link
                  href={`/reportes/${reporte.id}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-tinta-200 bg-white px-3 py-1.5 text-xs font-bold text-tinta-600 transition hover:border-tinta-300"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  Ver
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-start gap-2 rounded-2xl bg-crema-100 p-4 text-xs text-tinta-600">
        <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-encontrada-500" aria-hidden="true" />
        El carnet de vacunas queda visible para cualquiera que abra el perfil de la
        mascota (el mismo enlace del código QR de su placa).
      </p>
    </div>
  );
}
