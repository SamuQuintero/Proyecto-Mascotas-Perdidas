import { FormaHuella, huellasDelRastro, type Segmento } from "@/components/movimiento/rastro";

// Rastro de huellas que cruza un fondo oscuro de lado a lado, en bucle.
// Decorativo: se usa detrás del llamado final del inicio.
const RASTRO: Segmento[] = [
  [[-30, 330], [160, 300], [250, 120], [520, 150]],
  [[520, 150], [790, 180], [930, 40], [1230, 30]],
];
const HUELLAS = huellasDelRastro(RASTRO, 22, 9);

export default function HuellasCaminando({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 400"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    >
      <g
        fill="currentColor"
        style={{ "--ciclo": "9s", "--ritmo": "0.3s", "--inicio": "0.4s" } as React.CSSProperties}
      >
        {HUELLAS.map((huella, i) => (
          <g
            key={i}
            transform={`translate(${huella.x.toFixed(1)} ${huella.y.toFixed(1)}) rotate(${huella.angulo.toFixed(1)}) scale(1.6)`}
            style={{ "--paso": i } as React.CSSProperties}
          >
            <FormaHuella className="huella-paso" />
          </g>
        ))}
      </g>
    </svg>
  );
}
