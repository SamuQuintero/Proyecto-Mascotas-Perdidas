import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LogIn } from "lucide-react";
import FormularioLoginCuenta from "@/components/FormularioLoginCuenta";
import { usuarioActual } from "@/lib/cuenta";
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
    <div className="mx-auto max-w-md py-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-tinta-500 transition hover:gap-3 hover:text-tinta-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al inicio
      </Link>

      <div className="tarjeta relative animate-aparecer overflow-hidden p-8">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-perdida-100" />

        <div className="relative">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-perdida-400 to-reencontrada-500 text-white shadow-brillo">
            <LogIn className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="titulo-display mt-5 text-3xl">Iniciar sesión</h1>
          <p className="mb-6 mt-2 text-sm text-tinta-500">
            Ciudadanos y veterinarias entran por aquí.
          </p>

          <FormularioLoginCuenta siguiente={siguiente} />

          <p className="mt-5 text-center text-sm text-tinta-500">
            ¿No tienes cuenta?{" "}
            <Link href="/cuenta/registro" className="font-semibold text-perdida-600 hover:underline">
              Crea una
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
