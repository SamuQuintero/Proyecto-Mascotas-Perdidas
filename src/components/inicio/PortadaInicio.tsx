import { Fragment } from "react";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Search, Sparkles } from "lucide-react";
import TarjetaReporte from "@/components/TarjetaReporte";
import CaminoPasos from "@/components/inicio/CaminoPasos";
import EscenaRastro from "@/components/inicio/EscenaRastro";
import HuellasCaminando from "@/components/inicio/HuellasCaminando";
import Contador from "@/components/movimiento/Contador";
import PausaFueraDeVista from "@/components/movimiento/PausaFueraDeVista";
import type { Reporte } from "@/lib/tipos";

// Contenido de la página de inicio. Separado de page.tsx (que solo lee los
// datos) para que la composición no dependa de la base de datos.

type Estilo = React.CSSProperties & Record<`--${string}`, string | number>;

export default function PortadaInicio({
  recientes,
  perdidas,
  encontradas,
  reencontradas,
}: {
  recientes: Reporte[];
  perdidas: number;
  encontradas: number;
  reencontradas: number;
}) {
  return (
    <div className="space-y-28 sm:space-y-32">
      {/* Hero */}
      <section className="grid items-center gap-12 pt-2 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-7">
          <p
            className="subir inline-flex items-center gap-2 rounded-full border border-perdida-100 bg-white/80 px-3 py-1.5 text-sm font-semibold text-tinta-700 shadow-sm backdrop-blur"
            style={{ "--retraso": "0ms" } as Estilo}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-reencontrada-400 to-reencontrada-600 text-white">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            {reencontradas > 0
              ? `${reencontradas} ${reencontradas === 1 ? "mascota ya volvió" : "mascotas ya volvieron"} a casa`
              : "Una comunidad para reencontrarlos"}
          </p>

          <TitularHero />

          <p
            className="subir max-w-xl text-lg leading-relaxed text-tinta-500"
            style={{ "--retraso": "520ms" } as Estilo}
          >
            Publica en segundos un reporte con foto y ubicación, o busca entre
            las mascotas que tus vecinos ya encontraron. Juntos los traemos de
            vuelta.
          </p>

          <div
            className="subir flex flex-col gap-3 sm:flex-row"
            style={{ "--retraso": "640ms" } as Estilo}
          >
            <Link
              href="/perdida/nuevo"
              className="boton boton-brillo group bg-gradient-to-r from-perdida-500 to-perdida-600 px-7 py-4 text-base text-white shadow-brillo hover:-translate-y-1 hover:shadow-[0_18px_40px_-12px_rgba(255,107,69,0.7)] focus-visible:ring-perdida-200"
            >
              <Search className="gesto-buscar h-5 w-5" aria-hidden="true" />
              Perdí a mi mascota
            </Link>
            <Link
              href="/encontrada/nuevo"
              className="boton boton-brillo group bg-gradient-to-r from-encontrada-500 to-encontrada-600 px-7 py-4 text-base text-white shadow-brillo-menta hover:-translate-y-1 hover:shadow-[0_18px_40px_-12px_rgba(20,173,132,0.7)] focus-visible:ring-encontrada-200"
            >
              <HeartHandshake className="gesto-latir h-5 w-5" aria-hidden="true" />
              Encontré una mascota
            </Link>
          </div>

          <dl
            className="subir grid max-w-md grid-cols-3 gap-4 pt-2 sm:gap-8"
            style={{ "--retraso": "780ms" } as Estilo}
          >
            <Estadistica valor={perdidas} etiqueta="buscando a su familia" color="text-perdida-500" retraso={850} />
            <Estadistica valor={encontradas} etiqueta="hallazgos reportados" color="text-encontrada-500" retraso={950} />
            <Estadistica valor={reencontradas} etiqueta="finales felices" color="text-reencontrada-500" retraso={1050} />
          </dl>
        </div>

        <EscenaRastro reportes={recientes} />
      </section>

      {/* Recién publicados */}
      {recientes.length > 0 && (
        <section className="space-y-10">
          <div className="revelar flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="titulo-display max-w-lg text-3xl sm:text-5xl">
              ¿Has visto a alguno de ellos?
            </h2>
            <Link href="/reportes" className="boton-secundario group self-start sm:self-auto">
              Ver todos los reportes
              <ArrowRight className="gesto-flecha h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recientes.slice(0, 3).map((reporte, indice) => (
              <div
                key={reporte.id}
                className="revelar"
                style={{ "--desde": `${indice * 10}%`, "--hasta": `${55 + indice * 10}%` } as Estilo}
              >
                <TarjetaReporte reporte={reporte} indice={indice} entrada="scroll" />
              </div>
            ))}
          </div>
        </section>
      )}

      <CaminoPasos />

      {/* Llamado final */}
      <PausaFueraDeVista
        as="section"
        className="revelar relative isolate overflow-hidden rounded-4xl bg-tinta-900 px-6 py-16 text-center text-white sm:px-12 sm:py-20"
      >
        <div className="absolute -left-24 -top-24 -z-10 h-80 w-80 animate-deriva rounded-full bg-perdida-500/35 blur-3xl" />
        <div
          className="absolute -bottom-28 -right-12 -z-10 h-80 w-80 animate-deriva rounded-full bg-reencontrada-500/45 blur-3xl"
          style={{ animationDelay: "-7s" }}
        />
        <div
          className="absolute left-1/2 top-1/2 -z-10 h-56 w-56 animate-deriva rounded-full bg-encontrada-500/20 blur-3xl"
          style={{ animationDelay: "-3s" }}
        />
        <HuellasCaminando className="-z-10 text-white/[0.09]" />

        <div className="relative mx-auto max-w-2xl space-y-6">
          <h2 className="font-display text-3xl font-bold tracking-tight [text-wrap:balance] sm:text-5xl">
            Un minuto tuyo puede cambiar una historia.
          </h2>
          <p className="text-lg text-white/75">
            Revisa los reportes cerca de ti. Quizá la mascota que alguien busca
            está en tu cuadra.
          </p>
          <Link
            href="/reportes"
            className="boton boton-brillo group bg-white px-7 py-4 text-base text-tinta-900 hover:-translate-y-1 hover:shadow-[0_18px_40px_-12px_rgba(255,255,255,0.45)] focus-visible:ring-white/40"
          >
            Explorar reportes
            <ArrowRight className="gesto-flecha h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
      </PausaFueraDeVista>
    </div>
  );
}

// "Cada mascota merece volver a casa." entra palabra por palabra, y bajo
// "casa." se dibuja un trazo a mano cuando termina la frase.
function TitularHero() {
  const inicio = ["Cada", "mascota", "merece"];
  return (
    <h1 className="titulo-display text-5xl leading-[1.04] sm:text-6xl lg:text-7xl">
      {inicio.map((palabra, i) => (
        <Fragment key={palabra}>
          <span className="palabra" style={{ "--i": i } as Estilo}>
            {palabra}
          </span>{" "}
        </Fragment>
      ))}
      <span className="text-perdida-500">
        <span className="palabra" style={{ "--i": 3 } as Estilo}>
          volver
        </span>{" "}
        <span className="palabra" style={{ "--i": 4 } as Estilo}>
          a
        </span>{" "}
        <span className="relative inline-block">
          <span className="palabra" style={{ "--i": 5 } as Estilo}>
            casa.
          </span>
          <svg
            viewBox="0 0 200 24"
            preserveAspectRatio="none"
            className="absolute -bottom-[0.16em] left-[-4%] h-[0.3em] w-[104%] overflow-visible"
            aria-hidden="true"
          >
            <path
              d="M4 15 C40 7 80 19 120 11 S180 6 196 13"
              pathLength={1}
              className="trazo-dibujado"
              style={{ "--retraso": "1000ms" } as Estilo}
              fill="none"
              stroke="#FFC22E"
              strokeWidth="6"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </span>
      </span>
    </h1>
  );
}

function Estadistica({
  valor,
  etiqueta,
  color,
  retraso,
}: {
  valor: number;
  etiqueta: string;
  color: string;
  retraso: number;
}) {
  return (
    <div>
      <dt className="sr-only">{etiqueta}</dt>
      <dd>
        <Contador
          valor={valor}
          retraso={retraso}
          className={`block font-display text-4xl font-extrabold tabular-nums ${color}`}
        />
        <span className="block text-xs font-medium leading-snug text-tinta-500 sm:text-sm">
          {etiqueta}
        </span>
      </dd>
    </div>
  );
}
