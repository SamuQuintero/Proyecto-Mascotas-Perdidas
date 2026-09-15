import FormularioReporte from "@/components/FormularioReporte";

export const metadata = {
  title: "Reportar mascota perdida — PetMatch",
};

export default function NuevoReportePerdidaPage() {
  return <FormularioReporte tipo="PERDIDA" />;
}
