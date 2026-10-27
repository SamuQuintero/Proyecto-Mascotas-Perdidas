import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { EtiquetaEstado, EtiquetaTipo } from "@/components/Etiquetas";
import Inclinable from "@/components/movimiento/Inclinable";
import { formatearFechaHora, haceCuanto } from "@/lib/formato";
import { ETIQUETA_TAMANO, type Reporte } from "@/lib/tipos";

// `entrada` decide cuándo se revela la tarjeta: "tiempo" al cargar (listados
// que se ven de inmediato) o "scroll" cuando entra en pantalla (inicio).
export default function TarjetaReporte({
  reporte,
  indice = 0,
  entrada = "tiempo",
}: {
  reporte: Reporte;
  indice?: number;
  entrada?: "tiempo" | "scroll";
}) {
  const reencontrada = reporte.estado === "REENCONTRADA";
  const titulo = reporte.nombre || reporte.especie;
  const retraso = Math.min(indice, 8) * 60;

  return (
    <Inclinable className="h-full rounded-3xl">
      <Link
        href={`/reportes/${reporte.id}`}
        style={entrada === "tiempo" ? { animationDelay: `${retraso}ms` } : undefined}
        className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-tinta-200/70 bg-white shadow-suave transition-shadow duration-300 hover:shadow-elevada focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-perdida-200 ${
          entrada === "tiempo" ? "animate-aparecer" : ""
        }`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-tinta-100">
          <div
            className={`h-full w-full ${entrada === "tiempo" ? "foto-revelada" : "foto-con-scroll"}`}
            style={{ "--retraso": `${retraso + 120}ms` } as React.CSSProperties}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reporte.fotoUrl}
              alt={`Fotografía de ${titulo}`}
              loading="lazy"
              className={`h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.07] ${
                reencontrada ? "saturate-[0.85]" : ""
              }`}
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-tinta-900/50 to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <EtiquetaTipo tipo={reporte.tipo} enBusqueda={!reencontrada && reporte.tipo === "PERDIDA"} />
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
              <MapPin
                className="h-4 w-4 shrink-0 text-perdida-400 transition-transform duration-300 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
              <span className="truncate">{reporte.zona}</span>
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-reencontrada-400" aria-hidden="true" />
              {formatearFechaHora(reporte.fecha, "corta")}
            </p>
          </div>
        </div>
      </Link>
    </Inclinable>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="max-w-full truncate rounded-lg bg-tinta-100 px-2 py-0.5 text-xs font-medium text-tinta-600">
      {children}
    </span>
  );
}
