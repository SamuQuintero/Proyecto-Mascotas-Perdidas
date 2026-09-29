"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2, LockKeyhole, UserRound } from "lucide-react";

export default function FormularioLogin({ siguiente }: { siguiente: string }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setEnviando(false);
        return;
      }
      router.push(siguiente);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={iniciarSesion} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-tinta-700">Usuario</span>
        <span className="relative block">
          <UserRound
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-400"
            aria-hidden="true"
          />
          <input
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="campo-input pl-10"
            autoComplete="username"
            autoFocus
            required
          />
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-tinta-700">Contraseña</span>
        <span className="relative block">
          <LockKeyhole
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-400"
            aria-hidden="true"
          />
          <input
            type={verContrasena ? "text" : "password"}
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className="campo-input px-10"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setVerContrasena((valor) => !valor)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-tinta-400 transition hover:bg-tinta-100 hover:text-tinta-700"
            aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {verContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </span>
      </label>

      {error && (
        <p
          role="alert"
          className="animate-aparecer rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || !usuario || !contrasena}
        className="boton w-full bg-gradient-to-r from-reencontrada-500 to-reencontrada-600 py-3.5 text-white shadow-brillo-lavanda hover:-translate-y-0.5 focus-visible:ring-reencontrada-200"
      >
        {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {enviando ? "Entrando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
