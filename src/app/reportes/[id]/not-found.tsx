import Link from "next/link";
import { SearchX } from "lucide-react";

export default function ReporteNoEncontrado() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-perdida-100 text-perdida-600">
        <SearchX className="h-8 w-8" aria-hidden="true" />
      </span>
      <h1 className="titulo-display text-3xl">Reporte no encontrado</h1>
      <p className="text-tinta-500">Este reporte no existe o fue retirado.</p>
      <Link href="/reportes" className="boton-primario">
        Ver todos los reportes
      </Link>
    </div>
  );
}
