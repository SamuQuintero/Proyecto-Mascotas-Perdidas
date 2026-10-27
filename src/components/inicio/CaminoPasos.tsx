import { Camera, Heart, MapPin, MessageCircleHeart, Sparkle } from "lucide-react";
import PausaFueraDeVista from "@/components/movimiento/PausaFueraDeVista";

// "Cómo funciona" contado como un recorrido: un camino une los tres pasos,
// se dibuja a medida que la persona baja (scroll) y una luz lo recorre de
// la foto al reencuentro. Cada ícono actúa su propio paso: la cámara
// dispara, el pin cae en el mapa, los corazones suben.

const PASOS = [
  {
    titulo: "Publica con foto",
    texto: "Sube una foto, sus señas y la fecha. Toma menos de un minuto y no necesitas cuenta.",
    color: "from-perdida-400 to-perdida-600",
    sombra: "shadow-brillo",
    Ilustracion: IlustracionFoto,
  },
  {
    titulo: "Marca el lugar",
    texto: "Señala en el mapa dónde se vio por última vez para que los vecinos estén atentos.",
    color: "from-sol-300 to-sol-500",
    sombra: "shadow-[0_10px_30px_-10px_rgba(242,166,12,0.6)]",
    Ilustracion: IlustracionMapa,
  },
  {
    titulo: "Reencuéntrense",
    texto: "Quien la reconozca te contacta directamente. Cuando vuelva a casa, celebramos el final feliz.",
    color: "from-reencontrada-400 to-reencontrada-600",
    sombra: "shadow-brillo-lavanda",
    Ilustracion: IlustracionReencuentro,
  },
];

export default function CaminoPasos() {
  return (
    <section className="space-y-14">
      <h2 className="titulo-display revelar mx-auto max-w-2xl text-center text-3xl sm:text-5xl">
        Tres pasos para un reencuentro
      </h2>

      <PausaFueraDeVista className="relative">
        {/* Camino horizontal (escritorio): sus extremos caen bajo el centro
            del primer y del último ícono. */}
        <svg
          viewBox="0 0 1200 140"
          className="pointer-events-none absolute inset-x-0 top-12 hidden w-full -translate-y-1/2 md:block"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="camino-pasos" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#FF8663" />
              <stop offset="0.5" stopColor="#FFC22E" />
              <stop offset="1" stopColor="#9A7FFF" />
            </linearGradient>
          </defs>
          <path
            d="M200 70 C300 4 500 136 600 70 S900 4 1000 70"
            pathLength={1}
            className="dibujar-con-scroll"
            fill="none"
            stroke="url(#camino-pasos)"
            strokeOpacity="0.45"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M200 70 C300 4 500 136 600 70 S900 4 1000 70"
            pathLength={1}
            className="cometa"
            fill="none"
            stroke="url(#camino-pasos)"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>

        {/* Camino vertical (celular) */}
        <div
          className="absolute bottom-12 left-12 top-12 w-0 border-l-2 border-dashed border-tinta-200 md:hidden"
          aria-hidden="true"
        />

        <ol className="relative grid gap-10 md:grid-cols-3 md:gap-10">
          {PASOS.map(({ titulo, texto, color, sombra, Ilustracion }, indice) => (
            <li
              key={titulo}
              className="revelar flex gap-5 md:flex-col md:items-center md:text-center"
              style={
                {
                  "--desde": `${indice * 12}%`,
                  "--hasta": `${60 + indice * 12}%`,
                } as React.CSSProperties
              }
            >
              <div className="relative shrink-0">
                <span
                  className={`relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br text-white ring-8 ring-crema-50 ${color} ${sombra}`}
                >
                  <Ilustracion />
                </span>
                <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-tinta-900 font-display text-sm font-bold tabular-nums text-white ring-4 ring-crema-50">
                  {indice + 1}
                </span>
              </div>
              <div className="md:max-w-xs">
                <h3 className="titulo-display mt-1 text-xl md:mt-6 md:text-2xl">{titulo}</h3>
                <p className="mt-2 leading-relaxed text-tinta-500">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </PausaFueraDeVista>
    </section>
  );
}

function IlustracionFoto() {
  return (
    <>
      <Camera className="relative h-10 w-10" strokeWidth={2} aria-hidden="true" />
      <Sparkle
        className="absolute right-4 top-4 h-4 w-4 fill-white animate-latido"
        aria-hidden="true"
      />
      <span className="flash absolute inset-0 bg-white" aria-hidden="true" />
    </>
  );
}

function IlustracionMapa() {
  return (
    <>
      <span
        className="onda-suelo absolute bottom-[22px] h-3 w-10 rounded-[50%] border-2 border-white/80"
        aria-hidden="true"
      />
      <span className="absolute bottom-[25px] h-1.5 w-6 rounded-[50%] bg-tinta-900/20" aria-hidden="true" />
      <MapPin className="rebote-pin relative -mt-2 h-10 w-10 fill-white/25" strokeWidth={2} aria-hidden="true" />
    </>
  );
}

function IlustracionReencuentro() {
  return (
    <>
      <MessageCircleHeart className="relative h-10 w-10 animate-latido" strokeWidth={2} aria-hidden="true" />
      {[
        { dx: "-14px", retraso: "0ms", left: "30%" },
        { dx: "10px", retraso: "900ms", left: "58%" },
        { dx: "-4px", retraso: "1700ms", left: "46%" },
      ].map(({ dx, retraso, left }) => (
        <Heart
          key={retraso}
          className="flotar-corazon absolute bottom-4 h-3.5 w-3.5 fill-white text-white"
          style={{ left, "--dx": dx, "--retraso": retraso } as React.CSSProperties}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
