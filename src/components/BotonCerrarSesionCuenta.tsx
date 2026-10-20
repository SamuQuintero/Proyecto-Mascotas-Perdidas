"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function BotonCerrarSesionCuenta() {
  const router = useRouter();

  async function salir() {
    await fetch("/api/cuenta/sesion", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={salir}
      className="boton-secundario shrink-0"
      aria-label="Cerrar sesión"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Salir
    </button>
  );
}
