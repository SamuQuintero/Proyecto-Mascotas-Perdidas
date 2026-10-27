import Link from "next/link";
import { redirect } from "next/navigation";
import { LogIn } from "lucide-react";
import FormularioLoginCuenta from "@/components/FormularioLoginCuenta";
import ShellAcceso from "@/components/ShellAcceso";
import { usuarioActual } from "@/lib/cuenta";
import { cuentasPrueba } from "@/lib/cuentasPrueba";
import { rutaPanel } from "@/lib/roles";

export const metadata = {
  title: "Iniciar sesión — PetMatch",
};

function destinoSeguro(siguiente: string | undefined): string {
  return siguiente?.startsWith("/") && !siguiente.startsWith("//") ? siguiente : "/cuenta";
}

export default async function LoginCuentaPage({
  searchParams,
}: {
  searchParams: { siguiente?: string };
}) {
  const usuario = await usuarioActual();
  const siguiente = destinoSeguro(searchParams.siguiente);
  if (usuario) redirect(usuario.rol === "CIUDADANO" ? siguiente : rutaPanel(usuario.rol));

  return (
    <ShellAcceso
      variante="cuenta"
      Icono={LogIn}
      titulo="Iniciar sesión"
      subtitulo="Ciudadanos, veterinarias y refugios entran por aquí."
      pie={
        <>
          ¿No tienes cuenta?{" "}
          <Link href="/cuenta/registro" className="font-semibold text-perdida-600 hover:underline">
            Crea una
          </Link>
        </>
      }
    >
      <FormularioLoginCuenta siguiente={siguiente} cuentasPrueba={cuentasPrueba()} />
    </ShellAcceso>
  );
}
