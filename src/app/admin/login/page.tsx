import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import FormularioLogin from "./FormularioLogin";
import { adminActual } from "@/lib/admin";
import { adminConfigurado } from "@/lib/sesion";

export const metadata = {
  title: "Acceso administrador — PetMatch",
};

// Solo acepta rutas internas como destino tras iniciar sesión, para que un
// enlace ?siguiente=https://otro-sitio no redirija fuera de la aplicación.
function destinoSeguro(siguiente: string | undefined): string {
  return siguiente?.startsWith("/") && !siguiente.startsWith("//")
    ? siguiente
    : "/admin";
}

export default function LoginAdminPage({
  searchParams,
}: {
  searchParams: { siguiente?: string };
}) {
  const siguiente = destinoSeguro(searchParams.siguiente);
  if (adminActual()) {
    redirect(siguiente);
  }

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
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-reencontrada-100" />
        <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-sol-100" />

        <div className="relative">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-reencontrada-400 to-reencontrada-600 text-white shadow-brillo-lavanda">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="titulo-display mt-5 text-3xl">Acceso administrador</h1>
          <p className="mb-6 mt-2 text-sm text-tinta-500">
            Solo para gestionar reportes: editarlos y marcarlos como
            reencontrados. Para publicar o buscar mascotas no necesitas
            iniciar sesión.
          </p>

          {adminConfigurado() ? (
            <FormularioLogin siguiente={siguiente} />
          ) : (
            <p className="rounded-2xl border border-sol-200 bg-sol-100 px-4 py-3 text-sm text-tinta-700">
              El acceso de administrador no está configurado en este servidor.
              Define <code className="font-semibold">ADMIN_USUARIO</code> y{" "}
              <code className="font-semibold">ADMIN_CONTRASENA</code> en el
              archivo <code className="font-semibold">.env</code> y reinicia la
              aplicación.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
