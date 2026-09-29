import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { EtiquetaEstado, EtiquetaTipo } from "@/components/Etiquetas";
import { formatearFechaHora, haceCuanto } from "@/lib/formato";
import { ETIQUETA_TAMANO, type Reporte } from "@/lib/tipos";

export default function TarjetaReporte({
  reporte,
  indice = 0,
}: {
  reporte: Reporte;
  indice?: number;
}) {
  const reencontrada = reporte.estado === "REENCONTRADA";
  const titulo = reporte.nombre || reporte.especie;

  return (
    <Link
      href={`/reportes/${reporte.id}`}
      style={{ animationDelay: `${Math.min(indice, 8) * 60}ms` }}
      className="group relative flex animate-aparecer flex-col overflow-hidden rounded-3xl border border-tinta-200/70 bg-white shadow-suave transition duration-300 hover:-translate-y-1.5 hover:shadow-elevada focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-perdida-200"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-tinta-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={reporte.fotoUrl}
          alt={`Fotografía de ${titulo}`}
          loading="lazy"
          className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
            reencontrada ? "saturate-[0.85]" : ""
          }`}
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-tinta-900/50 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <EtiquetaTipo tipo={reporte.tipo} />
        </div>
        {reencontrada && (
          <div className="absolute right-3 top-3">
            <EtiquetaEstado estado="REENCONTRADA" />
          </div>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-tinta-700 backdrop-blur">
          {haceCuanto(reporte.creadoEn)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="titulo-display truncate text-lg">
            {titulo}
            {reporte.raza && (
              <span className="font-sans text-sm font-medium text-tinta-400">
                {" "}
                · {reporte.raza}
              </span>
            )}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip>{reporte.especie}</Chip>
            <Chip>{reporte.color}</Chip>
            <Chip>{ETIQUETA_TAMANO[reporte.tamano]}</Chip>
          </div>
        </div>

        <div className="mt-auto space-y-1.5 border-t border-dashed border-tinta-200 pt-3 text-sm text-tinta-500">
          <p className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 shrink-0 text-perdida-400" aria-hidden="true" />
            <span className="truncate">{reporte.zona}</span>
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-reencontrada-400" aria-hidden="true" />
            {formatearFechaHora(reporte.fecha, "corta")}
          </p>
        </div>
      </div>
    </Link>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="max-w-full truncate rounded-lg bg-tinta-100 px-2 py-0.5 text-xs font-medium text-tinta-600">
      {children}
    </span>
  );
}
