// Cada navegación vuelve a montar esta plantilla, así que el contenido de la
// página entra enfocándose (de borroso a nítido) en lugar de aparecer de golpe.
export default function Plantilla({ children }: { children: React.ReactNode }) {
  return <div className="entrada-pagina">{children}</div>;
}
