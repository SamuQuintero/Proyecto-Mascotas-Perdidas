import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import FormularioRegistro from "@/components/FormularioRegistro";
import { usuarioActual } from "@/lib/cuenta";

export const metadata = {
  title: "Crear cuenta — PetMatch",
};

export default async function RegistroPage() {
  const usuario = await usuarioActual();
  if (usuario) redirect(usuario.rol === "VETERINARIA" ? "/veterinaria" : "/cuenta");

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
        <div className="absolute -left-10 bottom-10 h-20 w-20 rounded-full bg-sol-100" />

        <div className="relative">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-perdida-400 to-reencontrada-500 text-white shadow-brillo">
            <UserPlus className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="titulo-display mt-5 text-3xl">Crear cuenta</h1>
          <p className="mb-6 mt-2 text-sm text-tinta-500">
            Solo hace falta si quieres recibir avisos de mascotas perdidas cerca de ti, o
            si eres una veterinaria y quieres vincular microchips. Para publicar o buscar
            reportes no necesitas cuenta.
          </p>

          <FormularioRegistro />

          <p className="mt-5 text-center text-sm text-tinta-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/cuenta/login" className="font-semibold text-perdida-600 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
