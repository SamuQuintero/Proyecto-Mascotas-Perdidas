import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BarChart3, Cat, Dog, Scale, Timer } from "lucide-react";
import { adminActual } from "@/lib/admin";
import { prisma } from "@/lib/db";
import {
  ESPECIES_INDICADORES,
  PERIODOS,
  calcularIndicadores,
  etiquetaMes,
  formatearDias,
  formatearPorcentaje,
  leerPeriodo,
} from "@/lib/indicadores";

export const metadata = {
  title: "Indicadores — PetMatch",
};

// Más que esto no se lee de una vez: el panel es para una ciudad, no para
// millones de filas. Si crece, habría que agregar en la base de datos.
const MAXIMO_REPORTES = 5000;

const COLOR_ESPECIE = {
  Perro: "bg-perdida-500",
  Gato: "bg-reencontrada-500",
  Otro: "bg-tinta-400",
} as const;

// HU-22: ¿la plataforma está cerrando la brecha entre perros y gatos?
export default async function IndicadoresPage({
  searchParams,
}: {
  searchParams: { periodo?: string };
}) {
  if (!adminActual()) redirect("/admin/login?siguiente=/admin/indicadores");

  const periodo = leerPeriodo(searchParams.periodo);
  const reportes = await prisma.reporte.findMany({
    select: {
      id: true,
      tipo: true,
      estado: true,
      especie: true,
      color: true,
      tamano: true,
      zona: true,
      latitud: true,
      longitud: true,
      fecha: true,
      creadoEn: true,
      reencontradaEn: true,
    },
    orderBy: { creadoEn: "desc" },
    take: MAXIMO_REPORTES,
  });

  const datos = calcularIndicadores(reportes, periodo);
  const perro = datos.porEspecie.find((e) => e.especie === "Perro")!;
  const gato = datos.porEspecie.find((e) => e.especie === "Gato")!;
  const maxMes = Math.max(
    1,
    ...datos.porMes.flatMap((m) => ESPECIES_INDICADORES.map((e) => m.porEspecie[e].perdidas))
  );

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-tinta-500 transition hover:gap-3 hover:text-tinta-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al panel
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="titulo-display flex items-center gap-3 text-3xl">
              <BarChart3 className="h-7 w-7 text-reencontrada-500" aria-hidden="true" />
              Indicadores
            </h1>
            <p className="mt-1 text-sm text-tinta-500">
              Reportes, coincidencias y reunificaciones por especie, zona y tiempo.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Periodo">
            {PERIODOS.map((p) => (
              <Link
                key={p.valor}
                href={`/admin/indicadores?periodo=${p.valor}`}
                aria-current={p.valor === periodo ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  p.valor === periodo
                    ? "bg-tinta-900 text-white"
                    : "border border-tinta-200 bg-white text-tinta-600 hover:border-tinta-300"
                }`}
              >
                {p.etiqueta}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="tarjeta p-6" aria-label="Brecha entre perros y gatos">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Scale className="h-5 w-5 text-reencontrada-500" aria-hidden="true" />
          Brecha entre perros y gatos
        </h2>
        {datos.brechaPerrosGatos === null ? (
          <p className="mt-2 text-sm text-tinta-500">
            Todavía no hay pérdidas de perros y de gatos en este periodo para compararlos.
          </p>
        ) : (
          <p className="mt-2 text-tinta-700">
            {datos.brechaPerrosGatos === 0 ? (
              <>Perros y gatos se reúnen con sus familias al mismo ritmo.</>
            ) : (
              <>
                {datos.brechaPerrosGatos > 0 ? "Los perros" : "Los gatos"} se reúnen con su
                familia{" "}
                <strong>{Math.abs(datos.brechaPerrosGatos)} puntos porcentuales</strong> más
                seguido que {datos.brechaPerrosGatos > 0 ? "los gatos" : "los perros"} (
                {formatearPorcentaje(perro.tasaReunificacion)} frente a{" "}
                {formatearPorcentaje(gato.tasaReunificacion)}).
              </>
            )}
          </p>
        )}
        <p className="mt-2 text-xs text-tinta-400">
          Tasa de reunificación = mascotas perdidas marcadas como reencontradas ÷ mascotas
          perdidas publicadas en el periodo.
        </p>
      </section>

      <section aria-label="Resumen por especie" className="grid gap-4 md:grid-cols-3">
        {datos.porEspecie.map((e) => (
          <div key={e.especie} className="tarjeta p-5">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold">
              {e.especie === "Perro" ? (
                <Dog className="h-5 w-5 text-perdida-500" aria-hidden="true" />
              ) : e.especie === "Gato" ? (
                <Cat className="h-5 w-5 text-reencontrada-500" aria-hidden="true" />
              ) : null}
              {e.especie === "Otro" ? "Otras especies" : `${e.especie}s`}
            </h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Cifra etiqueta="Perdidas" valor={String(e.perdidas)} />
              <Cifra etiqueta="Encontradas" valor={String(e.encontradas)} />
              <Cifra etiqueta="Reunificadas" valor={String(e.reunificadas)} />
              <Cifra etiqueta="Tasa de reunificación" valor={formatearPorcentaje(e.tasaReunificacion)} />
              <Cifra etiqueta="Con posible coincidencia" valor={String(e.conCoincidencia)} />
              <Cifra
                etiqueta="Tiempo promedio"
                valor={formatearDias(e.diasPromedioReunificacion)}
                icono={<Timer className="h-3.5 w-3.5" aria-hidden="true" />}
              />
            </dl>
          </div>
        ))}
      </section>

      <section className="tarjeta p-6">
        <h2 className="font-display text-lg font-bold">Mascotas perdidas por mes</h2>
        {datos.porMes.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-500">Sin reportes en este periodo.</p>
        ) : (
          <>
            <ul className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-tinta-600">
              {ESPECIES_INDICADORES.map((e) => (
                <li key={e} className="flex items-center gap-1.5">
                  <span className={`h-3 w-3 rounded-sm ${COLOR_ESPECIE[e]}`} aria-hidden="true" />
                  {e === "Otro" ? "Otras" : e}
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-4">
              {datos.porMes.map((m) => (
                <div key={m.mes}>
                  <p className="mb-1 text-sm font-semibold text-tinta-700">{etiquetaMes(m.mes)}</p>
                  <div className="space-y-1">
                    {ESPECIES_INDICADORES.map((e) => {
                      const celda = m.porEspecie[e];
                      return (
                        <div key={e} className="flex items-center gap-2 text-xs">
                          <span className="w-12 shrink-0 text-tinta-500">{e === "Otro" ? "Otras" : e}</span>
                          <div className="h-3 flex-1 rounded-full bg-tinta-50">
                            <div
                              className={`h-3 rounded-full ${COLOR_ESPECIE[e]}`}
                              style={{ width: `${(celda.perdidas / maxMes) * 100}%` }}
                            />
                          </div>
                          <span className="w-28 shrink-0 text-right font-semibold text-tinta-700">
                            {celda.perdidas} perdidas · {celda.reunificadas} reunif.
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="tarjeta overflow-x-auto p-6">
        <h2 className="font-display text-lg font-bold">Zonas con más actividad</h2>
        {datos.porZona.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-500">Sin reportes en este periodo.</p>
        ) : (
          <table className="mt-3 w-full min-w-[28rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-tinta-400">
              <tr>
                <th className="py-2 pr-4">Zona</th>
                <th className="py-2 pr-4">Perdidas</th>
                <th className="py-2 pr-4">Encontradas</th>
                <th className="py-2">Reunificadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tinta-100">
              {datos.porZona.map((z) => (
                <tr key={z.zona}>
                  <td className="py-2 pr-4 font-semibold text-tinta-800">{z.zona}</td>
                  <td className="py-2 pr-4">{z.perdidas}</td>
                  <td className="py-2 pr-4">{z.encontradas}</td>
                  <td className="py-2">{z.reunificadas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {reportes.length === MAXIMO_REPORTES && (
        <p className="text-xs text-tinta-500">
          Se analizaron los {MAXIMO_REPORTES} reportes más recientes.
        </p>
      )}
    </div>
  );
}

function Cifra({
  etiqueta,
  valor,
  icono,
}: {
  etiqueta: string;
  valor: string;
  icono?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-tinta-400">
        {icono}
        {etiqueta}
      </dt>
      <dd className="font-display text-xl font-extrabold text-tinta-900">{valor}</dd>
    </div>
  );
}
