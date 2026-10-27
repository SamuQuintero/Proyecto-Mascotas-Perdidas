import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import FormularioLogin from "./FormularioLogin";
import ShellAcceso from "@/components/ShellAcceso";
import { adminActual } from "@/lib/admin";
import { cuentaPruebaAdmin } from "@/lib/cuentasPrueba";
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
    <ShellAcceso
      variante="admin"
      Icono={ShieldCheck}
      titulo="Acceso administrador"
      subtitulo="Solo para gestionar reportes: editarlos y marcarlos como reencontrados. Para publicar o buscar mascotas no necesitas iniciar sesión."
    >
      {adminConfigurado() ? (
        <FormularioLogin siguiente={siguiente} cuentaPrueba={cuentaPruebaAdmin()} />
      ) : (
        <p className="rounded-2xl border border-sol-200 bg-sol-100 px-4 py-3 text-sm text-tinta-700">
          El acceso de administrador no está configurado en este servidor. Define{" "}
          <code className="font-semibold">ADMIN_USUARIO</code> y{" "}
          <code className="font-semibold">ADMIN_CONTRASENA</code> en el archivo{" "}
          <code className="font-semibold">.env</code> y reinicia la aplicación.
        </p>
      )}
    </ShellAcceso>
  );
}
