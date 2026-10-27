// Cada navegación vuelve a montar esta plantilla, así que el contenido de la
// página entra con un fundido suave en lugar de aparecer de golpe.
export default function Plantilla({ children }: { children: React.ReactNode }) {
  return <div className="animate-aparecer-suave">{children}</div>;
}
