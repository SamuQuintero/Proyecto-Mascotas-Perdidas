import { notFound, redirect } from "next/navigation";
import FormularioMascota from "@/components/FormularioMascota";
import { sesionGestion } from "@/lib/cuenta";
import { prisma } from "@/lib/db";
import { puedeGestionar } from "@/lib/propiedad";

export const metadata = {
  title: "Editar perfil de mascota — PetMatch",
};

// HU-23: el dueño actualiza la foto y los datos de contacto del perfil.
export default async function EditarMascotaPage({ params }: { params: { id: string } }) {
  const mascota = await prisma.mascota.findUnique({ where: { id: params.id } });
  if (!mascota) notFound();

  const sesion = await sesionGestion();
  if (!puedeGestionar(mascota, sesion)) {
    if (!sesion.esAdmin && sesion.usuarioId === null) {
      redirect(`/cuenta/login?siguiente=/mascotas/${params.id}/editar`);
    }
    redirect(`/mascotas/${params.id}`);
  }

  return <FormularioMascota mascotaInicial={mascota} />;
}
