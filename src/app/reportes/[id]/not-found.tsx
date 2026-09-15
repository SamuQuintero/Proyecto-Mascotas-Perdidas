import Link from "next/link";

export default function ReporteNoEncontrado() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-900">
        Reporte no encontrado
      </h1>
      <p className="text-slate-600">
        Este reporte no existe o fue eliminado.
      </p>
      <Link
        href="/reportes"
        className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        Ver todos los reportes
      </Link>
    </div>
  );
}
