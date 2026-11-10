import FormularioReporte from "@/components/FormularioReporte";
import { usuarioSesionLigera } from "@/lib/cuenta";

export const metadata = {
  title: "Reportar mascota perdida — PetMatch",
};

export default async function NuevoReportePerdidaPage() {
  return <FormularioReporte tipo="PERDIDA" conSesion={(await usuarioSesionLigera()) !== null} />;
}
