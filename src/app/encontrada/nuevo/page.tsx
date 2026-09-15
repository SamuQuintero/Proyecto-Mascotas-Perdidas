import FormularioReporte from "@/components/FormularioReporte";

export const metadata = {
  title: "Reportar mascota encontrada — PetMatch",
};

export default function NuevoReporteEncontradaPage() {
  return <FormularioReporte tipo="ENCONTRADA" />;
}
