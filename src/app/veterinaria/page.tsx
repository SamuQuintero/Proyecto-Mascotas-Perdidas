import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Search, ShieldCheck, Stethoscope } from "lucide-react";
import BotonCerrarSesionCuenta from "@/components/BotonCerrarSesionCuenta";
import { EtiquetaEstado, EtiquetaTipo } from "@/components/Etiquetas";
import EditorMicrochip from "@/components/EditorMicrochip";
import { usuarioActual } from "@/lib/cuenta";
import { prisma } from "@/lib/db";
import { formatearFechaHora } from "@/lib/formato";
import { contieneTexto } from "@/lib/texto";

export const metadata = {
  title: "Panel veterinaria — PetMatch",
};

// HU-17: panel para que una veterinaria busque un reporte y vincule (o
// corrija) el número de microchip que confirmó en consulta.
export default async function VeterinariaPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/cuenta/login?siguiente=/veterinaria");
  if (usuario.rol !== "VETERINARIA") redirect("/cuenta");

  const q = searchParams.q?.trim() ?? "";
  const reportes = (
    await prisma.reporte.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { creadoEn: "desc" },
      take: 200,
    })
  ).filter(
    (r) =>
      !q ||
      contieneTexto(r.nombre ?? "", q) ||
      contieneTexto(r.especie, q) ||
      contieneTexto(r.zona, q) ||
      contieneTexto(r.microchip ?? "", q)
  );

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-encontrada-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-encontrada-700 ring-1 ring-encontrada-200">
            <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
            {usuario.nombreClinica || "Veterinaria"}
          </p>
          <h1 className="titulo-display text-3xl">Vincular microchips</h1>
          <p className="mt-1 text-sm text-tinta-500">
            Busca un reporte y confirma el número de microchip que leíste en consulta.
          </p>
        </div>
        <BotonCerrarSesionCuenta />
      </header>

      <form method="get" className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-400"
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, especie, zona o microchip…"
          className="campo-input pl-11"
        />
      </form>

      {reportes.length === 0 ? (
        <div className="tarjeta px-6 py-14 text-center text-tinta-500">
          Ningún reporte coincide con la búsqueda.
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
                    <span className="font-sans text-sm font-medium text-tinta-400">
                      {" "}
                      · {reporte.color}
                    </span>
                  </p>
                  <p className="truncate text-sm text-tinta-500">
                    {reporte.zona} · {formatearFechaHora(reporte.fecha, "corta")}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <EtiquetaTipo tipo={reporte.tipo} />
                    <EtiquetaEstado estado={reporte.estado} />
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/reportes/${reporte.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-tinta-200 bg-white px-3 py-1.5 text-xs font-bold text-tinta-600 transition hover:border-tinta-300"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  Ver
                </Link>
                <EditorMicrochip
                  reporteId={reporte.id}
                  microchip={reporte.microchip}
                  verificadoPor={reporte.microchipVerificadoPor}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-start gap-2 rounded-2xl bg-crema-100 p-4 text-xs text-tinta-600">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-encontrada-500" aria-hidden="true" />
        El microchip queda visible en la página pública del reporte, marcado como
        verificado por tu clínica, para dar más confianza a quien lo encuentre.
      </p>
    </div>
  );
}
