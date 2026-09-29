import Link from "next/link";
import {
  ArrowRight,
  Camera,
  HeartHandshake,
  MapPin,
  MessageCircleHeart,
  PawPrint,
  Search,
  Sparkles,
} from "lucide-react";
import TarjetaReporte from "@/components/TarjetaReporte";
import { prisma } from "@/lib/db";
import { serializarReporte } from "@/lib/tipos";

export const dynamic = "force-dynamic";

const PASOS = [
  {
    Icono: Camera,
    titulo: "Publica con foto",
    texto: "Sube una foto, sus señas y la fecha. Toma menos de un minuto y no necesitas cuenta.",
    color: "from-perdida-400 to-perdida-600",
  },
  {
    Icono: MapPin,
    titulo: "Marca el lugar",
    texto: "Señala en el mapa dónde se vio por última vez para que los vecinos estén atentos.",
    color: "from-sol-300 to-sol-500",
  },
  {
    Icono: MessageCircleHeart,
    titulo: "Reencuéntrense",
    texto: "Quien la reconozca te contacta directamente. Cuando vuelva a casa, celebramos el final feliz.",
    color: "from-reencontrada-400 to-reencontrada-600",
  },
];

export default async function InicioPage() {
  const [recientes, conteos] = await Promise.all([
    prisma.reporte.findMany({
      where: { estado: "ACTIVO" },
      orderBy: { creadoEn: "desc" },
      take: 6,
    }),
    prisma.reporte.groupBy({ by: ["tipo", "estado"], _count: { _all: true } }),
  ]);

  const contar = (tipo: string | null, estado: string) =>
    conteos
      .filter((c) => (tipo === null || c.tipo === tipo) && c.estado === estado)
      .reduce((total, c) => total + c._count._all, 0);

  const perdidas = contar("PERDIDA", "ACTIVO");
  const encontradas = contar("ENCONTRADA", "ACTIVO");
  const reencontradas = contar(null, "REENCONTRADA");
  const reportes = recientes.map(serializarReporte);
  const collage = reportes.slice(0, 3);

  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="grid items-center gap-12 pt-2 lg:grid-cols-[1.1fr_1fr]">
        <div className="animate-aparecer space-y-7">
          <p className="inline-flex items-center gap-2 rounded-full border border-perdida-100 bg-white/80 px-3 py-1.5 text-sm font-semibold text-tinta-700 shadow-sm backdrop-blur">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-reencontrada-400 to-reencontrada-600 text-white">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            {reencontradas > 0
              ? `${reencontradas} ${reencontradas === 1 ? "mascota ya volvió" : "mascotas ya volvieron"} a casa`
              : "Una comunidad para reencontrarlos"}
          </p>

          <h1 className="titulo-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
            Cada mascota merece{" "}
            <span className="texto-degradado">volver a casa.</span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-tinta-500">
            Publica en segundos un reporte con foto y ubicación, o busca entre
            las mascotas que tus vecinos ya encontraron. Juntos los traemos de
            vuelta.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/perdida/nuevo"
              className="boton bg-gradient-to-r from-perdida-500 to-perdida-600 px-7 py-4 text-base text-white shadow-brillo hover:-translate-y-1 focus-visible:ring-perdida-200"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
              Perdí a mi mascota
            </Link>
            <Link
              href="/encontrada/nuevo"
              className="boton bg-gradient-to-r from-encontrada-500 to-encontrada-600 px-7 py-4 text-base text-white shadow-brillo-menta hover:-translate-y-1 focus-visible:ring-encontrada-200"
            >
              <HeartHandshake className="h-5 w-5" aria-hidden="true" />
              Encontré una mascota
            </Link>
          </div>

          <dl className="grid max-w-md grid-cols-3 gap-4 pt-2 sm:gap-8">
            <Estadistica valor={perdidas} etiqueta="buscando a su familia" color="text-perdida-500" />
            <Estadistica valor={encontradas} etiqueta="hallazgos reportados" color="text-encontrada-500" />
            <Estadistica valor={reencontradas} etiqueta="finales felices" color="text-reencontrada-500" />
          </dl>
        </div>

        <Collage reportes={collage} />
      </section>

      {/* Recién publicados */}
      {reportes.length > 0 && (
        <section className="space-y-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-perdida-500">
                Recién publicados
              </p>
              <h2 className="titulo-display mt-1 text-3xl sm:text-4xl">
                ¿Has visto a alguno de ellos?
              </h2>
            </div>
            <Link href="/reportes" className="boton-secundario self-start sm:self-auto">
              Ver todos los reportes
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reportes.slice(0, 3).map((reporte, indice) => (
              <TarjetaReporte key={reporte.id} reporte={reporte} indice={indice} />
            ))}
          </div>
        </section>
      )}

      {/* Cómo funciona */}
      <section className="space-y-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-reencontrada-500">
            Así de simple
          </p>
          <h2 className="titulo-display mt-1 text-3xl sm:text-4xl">
            Tres pasos para un reencuentro
          </h2>
        </div>
        <ol className="grid gap-5 md:grid-cols-3">
          {PASOS.map(({ Icono, titulo, texto, color }, indice) => (
            <li key={titulo} className="tarjeta relative overflow-hidden p-7">
              <span className="absolute right-6 top-4 font-display text-7xl font-extrabold leading-none text-tinta-100">
                {indice + 1}
              </span>
              <span
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-suave ${color}`}
              >
                <Icono className="h-7 w-7" aria-hidden="true" />
              </span>
              <h3 className="titulo-display relative mt-5 text-xl">{titulo}</h3>
              <p className="relative mt-2 text-tinta-500">{texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Llamado final */}
      <section className="relative overflow-hidden rounded-4xl bg-tinta-900 px-6 py-14 text-center text-white sm:px-12">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-perdida-500/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-reencontrada-500/40 blur-3xl" />
        <PawPrint
          className="absolute left-10 top-10 h-12 w-12 rotate-[-20deg] text-white/10"
          aria-hidden="true"
        />
        <PawPrint
          className="absolute bottom-10 right-12 h-16 w-16 rotate-[25deg] text-white/10"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-2xl space-y-5">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Un minuto tuyo puede cambiar una historia.
          </h2>
          <p className="text-lg text-white/70">
            Revisa los reportes cerca de ti. Quizá la mascota que alguien busca
            está en tu cuadra.
          </p>
          <Link
            href="/reportes"
            className="boton bg-white px-7 py-4 text-base text-tinta-900 hover:-translate-y-1 hover:shadow-elevada focus-visible:ring-white/40"
          >
            Explorar reportes
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Estadistica({
  valor,
  etiqueta,
  color,
}: {
  valor: number;
  etiqueta: string;
  color: string;
}) {
  return (
    <div>
      <dt className="sr-only">{etiqueta}</dt>
      <dd>
        <span className={`block font-display text-4xl font-extrabold ${color}`}>{valor}</span>
        <span className="block text-xs font-medium leading-snug text-tinta-500 sm:text-sm">
          {etiqueta}
        </span>
      </dd>
    </div>
  );
}

// Composición de fotos reales de los últimos reportes. Si aún no hay
// reportes, muestra una ilustración con íconos para que el inicio nunca se
// vea vacío.
function Collage({ reportes }: { reportes: ReturnType<typeof serializarReporte>[] }) {
  const posiciones = [
    "left-[6%] top-[4%] w-[58%] [--giro:-6deg]",
    "right-[2%] top-[22%] w-[48%] [--giro:5deg]",
    "left-[18%] bottom-[0%] w-[46%] [--giro:3deg]",
  ];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-lg" aria-hidden="true">
      <div className="absolute inset-[8%] rounded-full bg-gradient-to-br from-perdida-200 via-sol-200 to-reencontrada-200 opacity-70 blur-2xl" />

      {reportes.length > 0 ? (
        reportes.map((reporte, indice) => (
          <div
            key={reporte.id}
            className={`absolute animate-flotar rounded-3xl bg-white p-2.5 shadow-elevada ${posiciones[indice]}`}
            style={{ animationDelay: `${indice * -2}s` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reporte.fotoUrl}
              alt=""
              className="aspect-square w-full rounded-2xl object-cover"
            />
            <p className="truncate px-1.5 pb-0.5 pt-2 font-display text-sm font-bold text-tinta-800">
              {reporte.nombre || reporte.especie}
              <span className="font-sans text-xs font-medium text-tinta-400"> · {reporte.zona}</span>
            </p>
          </div>
        ))
      ) : (
        <div className="absolute inset-[18%] flex items-center justify-center rounded-[3rem] bg-white shadow-elevada">
          <PawPrint className="h-28 w-28 text-perdida-400" />
        </div>
      )}

      <div className="absolute right-[4%] top-[2%] flex animate-latido items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-reencontrada-600 shadow-elevada">
        <Sparkles className="h-4 w-4" />
        ¡Final feliz!
      </div>
      <div className="absolute bottom-[10%] right-[6%] flex items-center gap-2 rounded-2xl bg-tinta-900 px-3 py-2 text-sm font-bold text-white shadow-elevada">
        <MapPin className="h-4 w-4 text-perdida-400" />
        Cerca de ti
      </div>
    </div>
  );
}
