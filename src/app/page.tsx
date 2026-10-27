import PortadaInicio from "@/components/inicio/PortadaInicio";
import { resumenInicio } from "@/lib/cache";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const { recientes, conteos } = await resumenInicio();

  const contar = (tipo: string | null, estado: string) =>
    conteos
      .filter((c) => (tipo === null || c.tipo === tipo) && c.estado === estado)
      .reduce((total, c) => total + c._count._all, 0);

  return (
    <PortadaInicio
      recientes={recientes}
      perdidas={contar("PERDIDA", "ACTIVO")}
      encontradas={contar("ENCONTRADA", "ACTIVO")}
      reencontradas={contar(null, "REENCONTRADA")}
    />
  );
}
