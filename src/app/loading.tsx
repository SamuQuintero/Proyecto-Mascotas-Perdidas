import { FormaHuella } from "@/components/movimiento/rastro";

// Se muestra al instante mientras la página siguiente consulta la base de
// datos (~0,5 s por consulta desde Colombia). El navbar no cambia: solo este
// bloque, así la aplicación responde al clic sin esperar. Las huellas que
// avanzan dicen lo que pasa: estamos siguiendo el rastro.
const PASOS = [
  { x: 12, y: 30, giro: 80 },
  { x: 36, y: 16, giro: 100 },
  { x: 60, y: 30, giro: 80 },
  { x: 84, y: 16, giro: 100 },
];

export default function Cargando() {
  return (
    <div className="space-y-8" role="status" aria-label="Cargando">
      <div className="flex items-center gap-3 text-sm font-semibold text-tinta-500">
        <svg viewBox="0 0 96 44" className="h-7 w-16 text-perdida-400" aria-hidden="true">
          <g fill="currentColor" style={{ "--ciclo": "1.6s", "--ritmo": "0.2s" } as React.CSSProperties}>
            {PASOS.map((paso, i) => (
              <g
                key={i}
                transform={`translate(${paso.x} ${paso.y}) rotate(${paso.giro}) scale(0.9)`}
                style={{ "--paso": i } as React.CSSProperties}
              >
                <FormaHuella className="huella-paso" />
              </g>
            ))}
          </g>
        </svg>
        Siguiendo el rastro…
      </div>
      <div className="space-y-3">
        <div className="esqueleto h-5 w-40 !rounded-full" />
        <div className="esqueleto h-10 w-2/3 max-w-md" />
        <div className="esqueleto h-4 w-1/2 max-w-sm" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="tarjeta overflow-hidden">
            <div className="esqueleto aspect-[4/3] !rounded-none" />
            <div className="space-y-2 p-4">
              <div className="esqueleto h-5 w-3/4" />
              <div className="esqueleto h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
