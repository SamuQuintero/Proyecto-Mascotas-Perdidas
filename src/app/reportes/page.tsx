import Link from "next/link";
import { prisma } from "@/lib/db";
import TarjetaReporte from "@/components/TarjetaReporte";
import type { Reporte } from "@/lib/tipos";

export const metadata = {
  title: "Reportes publicados — PetMatch",
};

const PESTANAS = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "PERDIDA", etiqueta: "Perdidas" },
  { valor: "ENCONTRADA", etiqueta: "Encontradas" },
] as const;

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: { tipo?: string };
}) {
  const tipo = searchParams.tipo === "PERDIDA" || searchParams.tipo === "ENCONTRADA"
    ? searchParams.tipo
    : undefined;

  const reportes = (await prisma.reporte.findMany({
    where: tipo ? { tipo } : undefined,
    orderBy: { creadoEn: "desc" },
  })) as unknown as Reporte[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Reportes publicados
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Mascotas perdidas y encontradas registradas en la plataforma.
        </p>
      </div>

      <nav className="flex gap-2">
        {PESTANAS.map((pestana) => {
          const activa =
            (pestana.valor === "TODOS" && !tipo) || pestana.valor === tipo;
          return (
            <Link
              key={pestana.valor}
              href={
                pestana.valor === "TODOS"
                  ? "/reportes"
                  : `/reportes?tipo=${pestana.valor}`
              }
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activa
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {pestana.etiqueta}
            </Link>
          );
        })}
      </nav>

      {reportes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Aún no hay reportes publicados en esta categoría.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reportes.map((reporte) => (
            <TarjetaReporte key={reporte.id} reporte={reporte} />
          ))}
        </div>
      )}
    </div>
  );
}
