import Link from "next/link";

export default function InicioPage() {
  return (
    <div className="flex flex-col items-center gap-10 py-8 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          ¿Qué necesitas hacer?
        </h1>
        <p className="mx-auto max-w-md text-slate-600">
          Registra en segundos un reporte con foto y ubicación para ayudar a
          reencontrar a una mascota.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-5 sm:grid-cols-2">
        <Link
          href="/perdida/nuevo"
          className="group flex flex-col items-center gap-4 rounded-2xl border border-perdida-100 bg-perdida-50 p-8 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-perdida-500 text-2xl text-white">
            🔍
          </span>
          <span>
            <span className="block text-xl font-semibold text-perdida-700">
              Perdí a mi mascota
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              Publica un reporte con foto, señas y la última zona donde la
              viste.
            </span>
          </span>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-perdida-600 group-hover:gap-2 transition-all">
            Registrar reporte →
          </span>
        </Link>

        <Link
          href="/encontrada/nuevo"
          className="group flex flex-col items-center gap-4 rounded-2xl border border-encontrada-100 bg-encontrada-50 p-8 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-encontrada-500 text-2xl text-white">
            🐕
          </span>
          <span>
            <span className="block text-xl font-semibold text-encontrada-700">
              Encontré una mascota
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              Repórtala en menos de un minuto, sin crear una cuenta.
            </span>
          </span>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-encontrada-600 group-hover:gap-2 transition-all">
            Registrar hallazgo →
          </span>
        </Link>
      </div>

      <Link
        href="/reportes"
        className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
      >
        Ver todos los reportes publicados
      </Link>
    </div>
  );
}
