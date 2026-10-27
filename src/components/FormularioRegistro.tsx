"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Home, Loader2, PawPrint, Stethoscope } from "lucide-react";
import { Alerta } from "@/components/CamposFormulario";
import { rutaPanel, type RolCuenta } from "@/lib/roles";

// HU-16 (ciudadano) / HU-17 (veterinaria): un único formulario de registro
// con selector de tipo de cuenta, para no duplicar el flujo.
export default function FormularioRegistro() {
  const router = useRouter();
  const [rol, setRol] = useState<RolCuenta>("CIUDADANO");
  const [nombre, setNombre] = useState("");
  const [nombreClinica, setNombreClinica] = useState("");
  const [nombreRefugio, setNombreRefugio] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function registrar(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral(null);
    setEnviando(true);

    try {
      const respuesta = await fetch("/api/cuenta/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, contrasena, rol, nombreClinica, nombreRefugio }),
      });
      const data = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setErrores(data.errores ?? {});
        setErrorGeneral(data.error ?? "No se pudo crear la cuenta. Revisa los datos.");
        setEnviando(false);
        return;
      }

      router.push(rutaPanel(rol));
      router.refresh();
    } catch {
      setErrorGeneral("No se pudo conectar con el servidor. Intenta nuevamente.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={registrar} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setRol("CIUDADANO")}
          className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition ${
            rol === "CIUDADANO"
              ? "border-perdida-400 bg-perdida-50"
              : "border-tinta-200 bg-white hover:border-tinta-300"
          }`}
        >
          <PawPrint
            className={`h-6 w-6 ${rol === "CIUDADANO" ? "text-perdida-600" : "text-tinta-400"}`}
          />
          <span className="text-sm font-bold text-tinta-800">Soy ciudadano</span>
          <span className="text-xs text-tinta-500">Quiero recibir avisos cerca de mí</span>
        </button>
        <button
          type="button"
          onClick={() => setRol("VETERINARIA")}
          className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition ${
            rol === "VETERINARIA"
              ? "border-encontrada-400 bg-encontrada-50"
              : "border-tinta-200 bg-white hover:border-tinta-300"
          }`}
        >
          <Stethoscope
            className={`h-6 w-6 ${rol === "VETERINARIA" ? "text-encontrada-600" : "text-tinta-400"}`}
          />
          <span className="text-sm font-bold text-tinta-800">Soy veterinaria</span>
          <span className="text-xs text-tinta-500">Llevo el carnet de vacunas</span>
        </button>
        <button
          type="button"
          onClick={() => setRol("REFUGIO")}
          className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition ${
            rol === "REFUGIO"
              ? "border-reencontrada-400 bg-reencontrada-50"
              : "border-tinta-200 bg-white hover:border-tinta-300"
          }`}
        >
          <Home
            className={`h-6 w-6 ${rol === "REFUGIO" ? "text-reencontrada-600" : "text-tinta-400"}`}
          />
          <span className="text-sm font-bold text-tinta-800">Soy refugio</span>
          <span className="text-xs text-tinta-500">Publico animales en resguardo</span>
        </button>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-tinta-700">
          {rol === "CIUDADANO" ? "Nombre" : "Tu nombre"}
        </span>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="campo-input"
          aria-invalid={Boolean(errores.nombre)}
          required
        />
        {errores.nombre && (
          <span className="mt-1 block text-xs font-medium text-red-600">{errores.nombre}</span>
        )}
      </label>

      {rol === "VETERINARIA" && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-tinta-700">
            Nombre de la clínica o veterinaria
          </span>
          <input
            value={nombreClinica}
            onChange={(e) => setNombreClinica(e.target.value)}
            className="campo-input"
            placeholder="Ej. Veterinaria San Francisco"
            aria-invalid={Boolean(errores.nombreClinica)}
          />
          {errores.nombreClinica && (
            <span className="mt-1 block text-xs font-medium text-red-600">
              {errores.nombreClinica}
            </span>
          )}
        </label>
      )}

      {rol === "REFUGIO" && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-tinta-700">
            Nombre del refugio, fundación o rescatista
          </span>
          <input
            value={nombreRefugio}
            onChange={(e) => setNombreRefugio(e.target.value)}
            className="campo-input"
            placeholder="Ej. Fundación Huellitas de Pasto"
            aria-invalid={Boolean(errores.nombreRefugio)}
          />
          {errores.nombreRefugio && (
            <span className="mt-1 block text-xs font-medium text-red-600">
              {errores.nombreRefugio}
            </span>
          )}
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-tinta-700">Correo</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="campo-input"
          autoComplete="email"
          aria-invalid={Boolean(errores.email)}
          required
        />
        {errores.email && (
          <span className="mt-1 block text-xs font-medium text-red-600">{errores.email}</span>
        )}
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-tinta-700">Contraseña</span>
        <input
          type="password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          className="campo-input"
          autoComplete="new-password"
          aria-invalid={Boolean(errores.contrasena)}
          required
        />
        {errores.contrasena && (
          <span className="mt-1 block text-xs font-medium text-red-600">
            {errores.contrasena}
          </span>
        )}
      </label>

      {errorGeneral && <Alerta>{errorGeneral}</Alerta>}

      <button
        type="submit"
        disabled={enviando}
        className="boton-primario w-full py-3.5"
      >
        {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {enviando ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
