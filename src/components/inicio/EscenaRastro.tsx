import { MapPin, Sparkles } from "lucide-react";
import Parallax from "@/components/movimiento/Parallax";
import PausaFueraDeVista from "@/components/movimiento/PausaFueraDeVista";
import { FormaHuella, caminoSvg, huellasDelRastro, type Segmento } from "@/components/movimiento/rastro";
import type { Reporte } from "@/lib/tipos";

// Ilustración del hero: un mapa de barrio donde un rastro de huellas va
// desde el pin donde se perdió la mascota hasta su casa, que celebra cada
// vez que llegan. Encima flotan las fotos de los últimos reportes reales.
// Todo el movimiento es CSS (globals.css); el cursor mueve las capas a
// distinta profundidad (Parallax).

const RASTRO: Segmento[] = [
  [[96, 418], [168, 408], [158, 322], [240, 302]],
  [[240, 302], [322, 282], [298, 196], [360, 172]],
  [[360, 172], [392, 160], [404, 144], [410, 124]],
];
const CANTIDAD_HUELLAS = 12;
const RITMO_S = 0.28;
const INICIO_S = 1.3;
const CICLO_S = 5.6;
const LLEGADA_S = INICIO_S + CANTIDAD_HUELLAS * RITMO_S;

const HUELLAS = huellasDelRastro(RASTRO, CANTIDAD_HUELLAS, 6.5);
const CAMINO = caminoSvg(RASTRO);

const CALLES = [
  "M24 296 C150 274 300 338 496 286",
  "M306 24 C292 150 334 300 312 496",
  "M24 150 C130 170 208 96 306 118",
  "M150 496 C160 404 112 352 24 372",
  "M408 24 C418 120 400 200 430 296",
  "M312 404 C380 392 440 420 496 404",
];

const POSICION_FOTOS = [
  { caja: "left-0 top-[1%] w-[40%]", giro: "-6deg", profundidad: 22, retraso: 200 },
  { caja: "right-0 top-[38%] w-[35%]", giro: "5deg", profundidad: 30, retraso: 380 },
  { caja: "left-[47%] bottom-0 w-[30%]", giro: "-3deg", profundidad: 16, retraso: 520 },
];

export default function EscenaRastro({ reportes }: { reportes: Reporte[] }) {
  return (
    <PausaFueraDeVista className="relative mx-auto aspect-square w-full max-w-lg">
      <Parallax className="absolute inset-0">
        <div aria-hidden="true">
          <div
            data-profundidad="-10"
            className="absolute inset-[6%] rounded-full bg-gradient-to-br from-perdida-200 via-sol-200 to-reencontrada-200 opacity-70 blur-3xl"
          />

          {/* Mapa */}
          <div data-profundidad="8" className="absolute inset-0">
            <svg viewBox="0 0 520 520" className="subir h-full w-full" style={{ "--retraso": "0ms" } as React.CSSProperties}>
              <defs>
                <clipPath id="escena-mapa">
                  <rect x="24" y="24" width="472" height="472" rx="44" />
                </clipPath>
                <linearGradient id="escena-rastro" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0" stopColor="#FF6B45" />
                  <stop offset="0.55" stopColor="#F2A60C" />
                  <stop offset="1" stopColor="#7D5CF6" />
                </linearGradient>
                <filter id="escena-sombra" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#1C1829" floodOpacity="0.18" />
                </filter>
              </defs>

              <rect x="24" y="24" width="472" height="472" rx="44" fill="#FFF4E6" stroke="#FDE6CC" strokeWidth="2" />
              <g clipPath="url(#escena-mapa)">
                {/* Parque y río */}
                <ellipse cx="236" cy="206" rx="54" ry="36" fill="#D0F7E8" transform="rotate(-14 236 206)" />
                <circle cx="222" cy="200" r="7" fill="#A3EDD4" />
                <circle cx="248" cy="212" r="9" fill="#A3EDD4" />
                <circle cx="262" cy="194" r="5" fill="#A3EDD4" />
                <path d="M496 452 C430 446 404 486 380 520" fill="none" stroke="#EAE4FF" strokeWidth="34" strokeLinecap="round" />

                {/* Calles: borde y calzada, que se trazan al cargar */}
                {CALLES.map((d, i) => (
                  <g key={d} style={{ "--retraso": `${i * 90}ms` } as React.CSSProperties}>
                    <path d={d} pathLength={1} className="calle" fill="none" stroke="#FDE6CC" strokeWidth="24" strokeLinecap="round" />
                    <path d={d} pathLength={1} className="calle" fill="none" stroke="#FFFBF5" strokeWidth="17" strokeLinecap="round" />
                  </g>
                ))}

                {/* Rastro tenue que se intuye bajo las huellas */}
                <path
                  d={CAMINO}
                  pathLength={1}
                  className="calle"
                  style={{ "--retraso": "700ms" } as React.CSSProperties}
                  fill="none"
                  stroke="url(#escena-rastro)"
                  strokeOpacity="0.22"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>

              {/* Huellas */}
              <g
                fill="url(#escena-rastro)"
                style={
                  {
                    "--ciclo": `${CICLO_S}s`,
                    "--ritmo": `${RITMO_S}s`,
                    "--inicio": `${INICIO_S}s`,
                  } as React.CSSProperties
                }
              >
                {HUELLAS.map((huella, i) => (
                  <g
                    key={i}
                    transform={`translate(${huella.x.toFixed(1)} ${huella.y.toFixed(1)}) rotate(${huella.angulo.toFixed(1)}) scale(0.95)`}
                    style={{ "--paso": i } as React.CSSProperties}
                  >
                    <FormaHuella className="huella-paso" />
                  </g>
                ))}
              </g>

              {/* Pin del lugar donde se perdió, con ondas de radar */}
              <g transform="translate(96 418)">
                {[0, 900, 1800].map((retraso) => (
                  <ellipse
                    key={retraso}
                    className="radar"
                    style={{ "--retraso": `${retraso}ms` } as React.CSSProperties}
                    rx="18"
                    ry="8"
                    fill="none"
                    stroke="#FF6B45"
                    strokeWidth="2"
                  />
                ))}
                <ellipse rx="9" ry="3.5" fill="#1C1829" opacity="0.14" />
                <g className="caer-pin" style={{ "--retraso": "500ms" } as React.CSSProperties} filter="url(#escena-sombra)">
                  <path d="M0 0 C-4 -10 -17 -17 -17 -30 A17 17 0 1 1 17 -30 C17 -17 4 -10 0 0Z" fill="#FF6B45" />
                  <circle cy="-30" r="6.5" fill="#FFFBF5" />
                </g>
              </g>

              {/* Casa: celebra cuando llega la última huella */}
              <g
                transform="translate(414 98)"
                style={{ "--ciclo": `${CICLO_S}s`, "--retraso": `${LLEGADA_S}s` } as React.CSSProperties}
              >
                <circle r="26" fill="none" stroke="#9A7FFF" strokeWidth="3" className="anillo-llegada" />
                <circle r="26" fill="none" stroke="#FFC22E" strokeWidth="2" className="anillo-llegada" style={{ animationDelay: `${LLEGADA_S + 0.12}s` }} />
                <g className="llegada" filter="url(#escena-sombra)">
                  <circle r="25" fill="#7D5CF6" />
                  <path d="M-11 1 L0 -9.5 L11 1 M-7.5 -2 V10 H7.5 V-2" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M-2.6 10 V4.5 H2.6 V10" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
                </g>
                <path
                  className="corazon-sube"
                  d="M0 -30 C-3 -35 -10 -34 -10 -28.5 C-10 -24 -4 -20.5 0 -17.5 C4 -20.5 10 -24 10 -28.5 C10 -34 3 -35 0 -30Z"
                  fill="#FF6B45"
                />
              </g>
            </svg>
          </div>

          {/* Fotos reales de los últimos reportes */}
          {reportes.slice(0, 3).map((reporte, indice) => {
            const posicion = POSICION_FOTOS[indice];
            return (
              <div
                key={reporte.id}
                data-profundidad={posicion.profundidad}
                className={`absolute ${posicion.caja}`}
              >
                <div className="subir" style={{ "--retraso": `${posicion.retraso}ms` } as React.CSSProperties}>
                  <div
                    className="animate-flotar rounded-3xl bg-white p-2 shadow-elevada"
                    style={{ "--giro": posicion.giro, animationDelay: `${indice * -2}s` } as React.CSSProperties}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={reporte.fotoUrl} alt="" className="aspect-square w-full rounded-2xl object-cover" />
                    <p className="truncate px-1.5 pb-0.5 pt-1.5 font-display text-sm font-bold text-tinta-800">
                      {reporte.nombre || reporte.especie}
                      <span className="font-sans text-xs font-medium text-tinta-400"> · {reporte.zona}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Globos */}
          <div data-profundidad="38" className="absolute right-[1%] top-[3%]">
            <div className="subir" style={{ "--retraso": "900ms" } as React.CSSProperties}>
              <div className="flex animate-latido items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-reencontrada-600 shadow-elevada">
                <Sparkles className="h-4 w-4" />
                ¡Final feliz!
              </div>
            </div>
          </div>
          <div data-profundidad="34" className="absolute bottom-[4%] left-[2%]">
            <div className="subir" style={{ "--retraso": "1000ms" } as React.CSSProperties}>
              <div className="flex items-center gap-2 rounded-2xl bg-tinta-900 px-3 py-2 text-sm font-bold text-white shadow-elevada">
                <MapPin className="h-4 w-4 text-perdida-400" />
                Cerca de ti
              </div>
            </div>
          </div>
        </div>
      </Parallax>
    </PausaFueraDeVista>
  );
}
