"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, KeyRound, Loader2, UserRound } from "lucide-react";
import CampoAcceso from "@/components/CampoAcceso";
import CuentasPrueba from "@/components/CuentasPrueba";
import type { CuentaPrueba } from "@/lib/cuentasPrueba";

export default function FormularioLogin({
  siguiente,
  cuentaPrueba,
}: {
  siguiente: string;
  cuentaPrueba?: CuentaPrueba | null;
}) {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cambia en cada fallo para repetir la animación de "temblor".
  const [intentosFallidos, setIntentosFallidos] = useState(0);

  async function iniciarSesion(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      const respuesta = await fetch("/api/admin/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => ({}));
        setError(datos.error ?? "No se pudo iniciar sesión.");
        setIntentosFallidos((n) => n + 1);
        setEnviando(false);
        return;
      }
      setListo(true);
      router.push(siguiente);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
      setIntentosFallidos((n) => n + 1);
      setEnviando(false);
    }
  }

  return (
    <>
      <form onSubmit={iniciarSesion} className="space-y-4">
        <CampoAcceso
          etiqueta="Usuario"
          Icono={UserRound}
          valor={usuario}
          onCambiar={setUsuario}
          autoComplete="username"
          autoFocus
        />
        <CampoAcceso
          etiqueta="Contraseña"
          Icono={KeyRound}
          tipo="password"
          valor={contrasena}
          onCambiar={setContrasena}
          autoComplete="current-password"
        />

        {error && (
          <p
            key={intentosFallidos}
            role="alert"
            className="animate-temblar rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando || listo || !usuario || !contrasena}
          className="boton group w-full bg-gradient-to-r from-reencontrada-500 to-reencontrada-600 py-4 text-base text-white shadow-brillo-lavanda hover:-translate-y-0.5 hover:from-reencontrada-600 hover:to-reencontrada-700 focus-visible:ring-reencontrada-200"
        >
          {listo ? (
            <Check className="h-5 w-5 animate-marca-ok" aria-hidden="true" />
          ) : enviando ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : null}
          {listo ? "¡Bienvenido!" : enviando ? "Entrando…" : "Iniciar sesión"}
          {!enviando && !listo && (
            <ArrowRight
              className="h-5 w-5 transition group-hover:translate-x-1"
              aria-hidden="true"
            />
          )}
        </button>
      </form>

      {cuentaPrueba && (
        <CuentasPrueba
          cuentas={[cuentaPrueba]}
          alElegir={(cuenta) => {
            setUsuario(cuenta.usuario);
            setContrasena(cuenta.contrasena);
            setError(null);
          }}
        />
      )}
    </>
  );
}
