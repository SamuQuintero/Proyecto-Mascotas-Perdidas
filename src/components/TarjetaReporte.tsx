import Link from "next/link";
import { ETIQUETA_TAMANO, type Reporte } from "@/lib/tipos";

const ESTILO_TIPO = {
  PERDIDA: { etiqueta: "Perdida", clase: "bg-perdida-100 text-perdida-700" },
  ENCONTRADA: {
    etiqueta: "Encontrada",
    clase: "bg-encontrada-100 text-encontrada-700",
  },
} as const;

export default function TarjetaReporte({ reporte }: { reporte: Reporte }) {
  const estilo = ESTILO_TIPO[reporte.tipo];

  return (
    <Link
      href={`/reportes/${reporte.id}`}
      className="group flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={reporte.fotoUrl}
        alt={`Fotografía de ${reporte.especie.toLowerCase()} ${reporte.tipo === "PERDIDA" ? "perdido" : "encontrado"}`}
        className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${estilo.clase}`}
        >
          {estilo.etiqueta}
        </span>
        <h3 className="mt-1 truncate font-semibold text-slate-900">
          {reporte.nombre || reporte.especie}
          {reporte.raza ? ` · ${reporte.raza}` : ""}
        </h3>
        <p className="truncate text-sm text-slate-600">
          {reporte.color} · {ETIQUETA_TAMANO[reporte.tamano]}
        </p>
        <p className="truncate text-sm text-slate-500">📍 {reporte.zona}</p>
        <p className="text-xs text-slate-400">
          {new Date(reporte.fecha).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </Link>
  );
}
