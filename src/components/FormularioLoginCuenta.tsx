"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, KeyRound, Loader2, Mail } from "lucide-react";
import CampoAcceso from "@/components/CampoAcceso";
import { Alerta } from "@/components/CamposFormulario";
import CuentasPrueba from "@/components/CuentasPrueba";
import type { CuentaPrueba } from "@/lib/cuentasPrueba";
import { rutaPanel } from "@/lib/roles";

export default function FormularioLoginCuenta({
  siguiente,
  cuentasPrueba,
}: {
  siguiente: string;
  cuentasPrueba?: CuentaPrueba[] | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Cambia en cada fallo para repetir la animación de "temblor".
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const respuesta = await fetch("/api/cuenta/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, contrasena }),
      });
      const data = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        setIntentosFallidos((n) => n + 1);
        setEnviando(false);
        return;
      }

      setListo(true);
      router.push(data.usuario.rol === "CIUDADANO" ? siguiente : rutaPanel(data.usuario.rol));
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
      setIntentosFallidos((n) => n + 1);
      setEnviando(false);
    }
  }

  return (
    <>
      <form onSubmit={entrar} className="space-y-4" noValidate>
        <CampoAcceso
          etiqueta="Correo"
          Icono={Mail}
          tipo="email"
          valor={email}
          onCambiar={setEmail}
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          autoFocus
        />
        <CampoAcceso
          etiqueta="Contraseña"
          Icono={KeyRound}
          tipo="password"
          valor={contrasena}
          onCambiar={setContrasena}
          autoComplete="current-password"
          placeholder="Tu contraseña"
        />

        {error && (
          <div key={intentosFallidos} className="animate-temblar">
            <Alerta>{error}</Alerta>
          </div>
        )}

        <button
          type="submit"
          disabled={enviando || listo || !email || !contrasena}
          className="boton group w-full bg-gradient-to-r from-perdida-500 to-perdida-600 py-4 text-base text-white shadow-brillo hover:-translate-y-0.5 hover:from-perdida-600 hover:to-perdida-700 focus-visible:ring-perdida-200"
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

      {cuentasPrueba && (
        <CuentasPrueba
          cuentas={cuentasPrueba}
          alElegir={(cuenta) => {
            setEmail(cuenta.usuario);
            setContrasena(cuenta.contrasena);
            setError(null);
          }}
        />
      )}
    </>
  );
}
