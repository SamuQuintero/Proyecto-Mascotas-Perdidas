import FormularioReporte from "@/components/FormularioReporte";
import { usuarioSesionLigera } from "@/lib/cuenta";

export const metadata = {
  title: "Reportar mascota encontrada — PetMatch",
};

export default function NuevoReporteEncontradaPage() {
  return <FormularioReporte tipo="ENCONTRADA" conSesion={usuarioSesionLigera() !== null} />;
}
