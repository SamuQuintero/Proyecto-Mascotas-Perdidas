import { Heart, PawPrint } from "lucide-react";

// Ráfaga única de corazones y huellas que salen desde el centro del
// contenedor (que debe ser `relative`). Se reserva para los momentos que la
// merecen: una publicación nueva y, sobre todo, una mascota que volvió a
// casa. Las posiciones son fijas (no aleatorias) para que servidor y
// cliente pinten lo mismo.
const COLORES = ["text-sol-300", "text-white", "text-perdida-300", "text-encontrada-300", "text-reencontrada-200"];

export default function Celebracion({
  cantidad = 14,
  radio = 90,
  achatado = 0.6,
  retraso = 150,
}: {
  cantidad?: number;
  radio?: number;
  achatado?: number;
  retraso?: number;
}) {
  return (
    <span className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden="true">
      {Array.from({ length: cantidad }, (_, i) => {
        const angulo = (i / cantidad) * Math.PI * 2 + (i % 2) * 0.22;
        const distancia = radio * (0.65 + (i % 3) * 0.2);
        const Icono = i % 3 === 0 ? PawPrint : Heart;
        return (
          <Icono
            key={i}
            className={`estallido absolute left-0 top-0 fill-current ${COLORES[i % COLORES.length]} ${
              i % 2 ? "h-3 w-3" : "h-4 w-4"
            }`}
            strokeWidth={i % 3 === 0 ? 2 : 0}
            style={
              {
                "--dx": `${(Math.cos(angulo) * distancia).toFixed(1)}px`,
                "--dy": `${(Math.sin(angulo) * distancia * achatado).toFixed(1)}px`,
                "--giro": `${(i % 2 ? 1 : -1) * (40 + i * 9)}deg`,
                "--retraso": `${retraso + (i % 4) * 40}ms`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
