"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Alerta } from "@/components/CamposFormulario";
import { rutaPanel } from "@/lib/roles";

export default function FormularioLoginCuenta({ siguiente }: { siguiente: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

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
        setEnviando(false);
        return;
      }

      router.push(data.usuario.rol === "CIUDADANO" ? siguiente : rutaPanel(data.usuario.rol));
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="space-y-4" noValidate>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-tinta-700">Correo</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="campo-input"
          autoComplete="email"
          autoFocus
          required
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-tinta-700">Contraseña</span>
        <input
          type="password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          className="campo-input"
          autoComplete="current-password"
          required
        />
      </label>

      {error && <Alerta>{error}</Alerta>}

      <button type="submit" disabled={enviando} className="boton-primario w-full py-3.5">
        {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {enviando ? "Entrando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
