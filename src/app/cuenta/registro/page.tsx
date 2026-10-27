import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import FormularioRegistro from "@/components/FormularioRegistro";
import ShellAcceso from "@/components/ShellAcceso";
import { usuarioActual } from "@/lib/cuenta";
import { rutaPanel } from "@/lib/roles";

export const metadata = {
  title: "Crear cuenta — PetMatch",
};

export default async function RegistroPage() {
  const usuario = await usuarioActual();
  if (usuario) redirect(rutaPanel(usuario.rol));

  return (
    <ShellAcceso
      variante="registro"
      Icono={UserPlus}
      titulo="Crear cuenta"
      subtitulo="Solo hace falta si quieres recibir avisos de mascotas perdidas cerca de ti, renovar y editar tus reportes, o si eres veterinaria o refugio. Para publicar o buscar reportes no necesitas cuenta."
      pie={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/cuenta/login" className="font-semibold text-perdida-600 hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <FormularioRegistro />
    </ShellAcceso>
  );
}
