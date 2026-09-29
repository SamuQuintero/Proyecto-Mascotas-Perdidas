import Link from "next/link";
import { PawPrint, Plus, SearchX, X } from "lucide-react";
import { buscarReportes } from "@/lib/busqueda";
import FiltrosReportes from "@/components/FiltrosReportes";
import TarjetaReporte from "@/components/TarjetaReporte";
import {
  contarFiltrosActivos,
  leerFiltros,
  urlConFiltros,
  type FiltrosReporte,
} from "@/lib/filtros";
import { formatearFecha } from "@/lib/formato";
import { ETIQUETA_TAMANO } from "@/lib/tipos";

export const metadata = {
  title: "Reportes publicados — PetMatch",
};

const PESTANAS_TIPO = [
  { valor: undefined, etiqueta: "Todos" },
  { valor: "PERDIDA", etiqueta: "Perdidas" },
  { valor: "ENCONTRADA", etiqueta: "Encontradas" },
] as const;

const PESTANAS_ESTADO = [
  { valor: "ACTIVO", etiqueta: "Casos abiertos" },
  { valor: "REENCONTRADA", etiqueta: "Reencontradas" },
  { valor: "TODOS", etiqueta: "Todos" },
] as const;

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filtros = leerFiltros(searchParams);

  const reportes = await buscarReportes(filtros);

  const hayFiltros = contarFiltrosActivos(filtros) > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="animate-aparecer">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-perdida-600 ring-1 ring-perdida-100">
            <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
            Comunidad PetMatch
          </p>
          <h1 className="titulo-display text-3xl sm:text-4xl">
            Reportes publicados
          </h1>
          <p className="mt-2 max-w-xl text-tinta-500">
            Cada tarjeta es una mascota esperando volver a casa. Filtra para
            encontrar solo lo que coincide con tu caso.
          </p>
        </div>
        <Link href="/perdida/nuevo" className="boton-primario self-start sm:self-auto">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Publicar reporte
        </Link>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Segmentos
          etiqueta="Tipo de reporte"
          opciones={PESTANAS_TIPO.map((p) => ({
            etiqueta: p.etiqueta,
            href: urlConFiltros(filtros, { tipo: p.valor }),
            activa: filtros.tipo === p.valor,
          }))}
        />
        <Segmentos
          etiqueta="Estado del caso"
          opciones={PESTANAS_ESTADO.map((p) => ({
            etiqueta: p.etiqueta,
            href: urlConFiltros(filtros, { estado: p.valor }),
            activa: filtros.estado === p.valor,
          }))}
        />
      </div>

      <FiltrosReportes filtros={filtros} />

      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-1 text-sm font-semibold text-tinta-600">
          {reportes.length === 1
            ? "1 reporte"
            : `${reportes.length} reportes`}
        </p>
        {chipsDeFiltros(filtros).map((chip) => (
          <Link
            key={chip.clave}
            href={urlConFiltros(filtros, { [chip.clave]: undefined })}
            className="group inline-flex items-center gap-1.5 rounded-full bg-tinta-900 py-1 pl-3 pr-2 text-xs font-semibold text-white transition hover:bg-tinta-700"
            aria-label={`Quitar filtro ${chip.texto}`}
          >
            {chip.texto}
            <X className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" aria-hidden="true" />
          </Link>
        ))}
      </div>

      {reportes.length === 0 ? (
        <div className="tarjeta flex flex-col items-center gap-4 px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-crema-100 to-crema-200 text-perdida-500">
            <SearchX className="h-8 w-8" aria-hidden="true" />
          </span>
          <div>
            <h2 className="titulo-display text-xl">
              {hayFiltros ? "Ningún reporte coincide" : "Aún no hay reportes aquí"}
            </h2>
            <p className="mt-1 text-sm text-tinta-500">
              {hayFiltros
                ? "Prueba quitando algún filtro o ampliando el rango de fechas."
                : "Cuando alguien publique un reporte en esta categoría aparecerá aquí."}
            </p>
          </div>
          {hayFiltros && (
            <Link
              href={urlConFiltros(filtros, {
                especie: undefined,
                tamano: undefined,
                zona: undefined,
                color: undefined,
                desde: undefined,
                hasta: undefined,
              })}
              className="boton-secundario"
            >
              Quitar todos los filtros
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reportes.map((reporte, indice) => (
            <TarjetaReporte key={reporte.id} reporte={reporte} indice={indice} />
          ))}
        </div>
      )}
    </div>
  );
}

function chipsDeFiltros(filtros: FiltrosReporte) {
  const chips: { clave: keyof FiltrosReporte; texto: string }[] = [];
  if (filtros.zona) chips.push({ clave: "zona", texto: `Zona: ${filtros.zona}` });
  if (filtros.especie) chips.push({ clave: "especie", texto: filtros.especie });
  if (filtros.color) chips.push({ clave: "color", texto: `Color: ${filtros.color}` });
  if (filtros.tamano) {
    chips.push({ clave: "tamano", texto: ETIQUETA_TAMANO[filtros.tamano] });
  }
  if (filtros.desde) {
    chips.push({ clave: "desde", texto: `Desde ${formatearFecha(filtros.desde)}` });
  }
  if (filtros.hasta) {
    chips.push({ clave: "hasta", texto: `Hasta ${formatearFecha(filtros.hasta)}` });
  }
  return chips;
}

function Segmentos({
  etiqueta,
  opciones,
}: {
  etiqueta: string;
  opciones: { etiqueta: string; href: string; activa: boolean }[];
}) {
  return (
    <nav
      aria-label={etiqueta}
      className="flex w-full gap-1 overflow-x-auto rounded-full border border-tinta-200/70 bg-white/80 p-1 shadow-sm md:w-auto"
    >
      {opciones.map((opcion) => (
        <Link
          key={opcion.etiqueta}
          href={opcion.href}
          aria-current={opcion.activa ? "page" : undefined}
          className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-center text-sm font-semibold transition md:flex-none ${
            opcion.activa
              ? "bg-tinta-900 text-white shadow-sm"
              : "text-tinta-500 hover:bg-tinta-100 hover:text-tinta-900"
          }`}
        >
          {opcion.etiqueta}
        </Link>
      ))}
    </nav>
  );
}
