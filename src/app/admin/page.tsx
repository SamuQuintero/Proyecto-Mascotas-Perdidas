import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Eye,
  HeartHandshake,
  LayoutDashboard,
  Pencil,
  Search,
  Sparkles,
  Files,
} from "lucide-react";
import BotonEstadoRapido from "./BotonEstadoRapido";
import { EtiquetaEstado, EtiquetaTipo } from "@/components/Etiquetas";
import { adminActual } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { formatearFechaHora } from "@/lib/formato";

export const metadata = {
  title: "Panel de administración — PetMatch",
};

const VISTAS = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "abiertos", etiqueta: "Casos abiertos" },
  { valor: "reencontrados", etiqueta: "Reencontrados" },
] as const;

// Panel del administrador para llevar el control de todos los reportes.
export default async function PanelAdminPage({
  searchParams,
}: {
  searchParams: { ver?: string };
}) {
  const admin = adminActual();
  if (!admin) {
    redirect("/admin/login?siguiente=/admin");
  }

  const vista = VISTAS.find((v) => v.valor === searchParams.ver)?.valor ?? "todos";

  const [reportes, conteos] = await Promise.all([
    prisma.reporte.findMany({
      where:
        vista === "abiertos"
          ? { estado: "ACTIVO" }
          : vista === "reencontrados"
            ? { estado: "REENCONTRADA" }
            : undefined,
      orderBy: { creadoEn: "desc" },
    }),
    prisma.reporte.groupBy({
      by: ["tipo", "estado"],
      _count: { _all: true },
    }),
  ]);

  const contar = (filtro: (c: (typeof conteos)[number]) => boolean) =>
    conteos.filter(filtro).reduce((total, c) => total + c._count._all, 0);

  const estadisticas = [
    {
      etiqueta: "Reportes totales",
      valor: contar(() => true),
      Icono: Files,
      clase: "from-tinta-700 to-tinta-900",
    },
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

  return (
    <div className="space-y-8">
      <header className="animate-aparecer">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-reencontrada-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-reencontrada-700 ring-1 ring-reencontrada-200">
          <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
          Panel de administración
        </p>
        <h1 className="titulo-display text-3xl sm:text-4xl">Hola, {admin} 👋</h1>
        <p className="mt-2 text-tinta-500">
          Aquí llevas el control de todos los reportes: revisa, corrige y
          celebra cada reencuentro.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Resumen">
        {estadisticas.map(({ etiqueta, valor, Icono, clase }, indice) => (
          <div
            key={etiqueta}
            className="tarjeta animate-aparecer p-5"
            style={{ animationDelay: `${indice * 70}ms` }}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${clase}`}
            >
              <Icono className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-4 font-display text-3xl font-extrabold text-tinta-900">{valor}</p>
            <p className="text-sm font-medium text-tinta-500">{etiqueta}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <nav
          aria-label="Filtrar por estado"
          className="flex w-full gap-1 overflow-x-auto rounded-full border border-tinta-200/70 bg-white/80 p-1 shadow-sm sm:w-auto sm:self-start"
        >
          {VISTAS.map((v) => (
            <Link
              key={v.valor}
              href={v.valor === "todos" ? "/admin" : `/admin?ver=${v.valor}`}
              aria-current={vista === v.valor ? "page" : undefined}
              className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-center text-sm font-semibold transition sm:flex-none ${
                vista === v.valor
                  ? "bg-tinta-900 text-white shadow-sm"
                  : "text-tinta-500 hover:bg-tinta-100 hover:text-tinta-900"
              }`}
            >
              {v.etiqueta}
            </Link>
          ))}
        </nav>

        {reportes.length === 0 ? (
          <div className="tarjeta px-6 py-14 text-center text-tinta-500">
            No hay reportes en esta vista.
          </div>
        ) : (
          <ul className="tarjeta divide-y divide-tinta-100 overflow-hidden">
            {reportes.map((reporte) => {
              const nombre = reporte.nombre || reporte.especie;
              return (
                <li
                  key={reporte.id}
                  className="flex flex-col gap-4 p-4 transition hover:bg-crema-50 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={reporte.fotoUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-bold text-tinta-900">
                        {nombre}
                        <span className="font-sans text-sm font-medium text-tinta-400">
                          {" "}
                          · {reporte.color}
                        </span>
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

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                      href={`/reportes/${reporte.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-tinta-200 bg-white px-3 py-1.5 text-xs font-bold text-tinta-600 transition hover:border-tinta-300"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Ver
                    </Link>
                    <Link
                      href={`/reportes/${reporte.id}/editar`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-tinta-200 bg-white px-3 py-1.5 text-xs font-bold text-tinta-600 transition hover:border-tinta-300"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Editar
                    </Link>
                    <BotonEstadoRapido
                      id={reporte.id}
                      estado={reporte.estado}
                      nombre={nombre}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
