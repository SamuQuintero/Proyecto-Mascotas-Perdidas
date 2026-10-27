"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, MapPin, Save } from "lucide-react";
import { Alerta } from "@/components/CamposFormulario";

const MapaSelector = dynamic(() => import("@/components/MapaSelector"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 animate-pulse items-center justify-center rounded-2xl bg-tinta-100 text-sm text-tinta-400">
      Cargando mapa…
    </div>
  ),
});

interface Props {
  inicial: {
    telefono: string | null;
    direccion: string | null;
    latitud: number | null;
    longitud: number | null;
    recibeEncontradas: boolean;
  };
}

// HU-18: datos públicos de una veterinaria o refugio para el directorio
// "Dónde acudir". Solo aparece allí si activa "Recibimos mascotas encontradas".
export default function PerfilEstablecimiento({ inicial }: Props) {
  const router = useRouter();
  const [telefono, setTelefono] = useState(inicial.telefono ?? "");
  const [direccion, setDireccion] = useState(inicial.direccion ?? "");
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(
    inicial.latitud !== null && inicial.longitud !== null
      ? { lat: inicial.latitud, lng: inicial.longitud }
      : null
  );
  const [recibe, setRecibe] = useState(inicial.recibeEncontradas);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setMensaje(null);
    setError(null);
    setErrores({});
    try {
      const respuesta = await fetch("/api/cuenta/establecimiento", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telefono,
          direccion,
          latitud: ubicacion?.lat ?? null,
          longitud: ubicacion?.lng ?? null,
          recibeEncontradas: recibe,
        }),
      });
      const data = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setErrores(data.errores ?? {});
        setError(data.error ?? "Revisa los datos marcados.");
        return;
      }
      setMensaje(
        recibe
          ? "Guardado: ya apareces en el directorio “Dónde acudir”."
          : "Guardado. No apareces en el directorio mientras la opción esté apagada."
      );
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4" noValidate>
      <label className="flex items-start gap-3 rounded-2xl bg-crema-100 p-4">
        <input
          type="checkbox"
          checked={recibe}
          onChange={(e) => setRecibe(e.target.checked)}
          className="mt-1 h-4 w-4 accent-encontrada-500"
        />
        <span>
          <span className="block text-sm font-bold text-tinta-800">
            Recibimos mascotas encontradas
          </span>
          <span className="block text-xs text-tinta-500">
            Quien encuentre un animal y no pueda quedárselo verá tu teléfono, dirección y
            ubicación en “Dónde acudir”.
          </span>
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-tinta-700">Teléfono</span>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="campo-input"
            inputMode="tel"
            placeholder="Ej. 300 123 4567"
            aria-invalid={Boolean(errores.telefono)}
          />
          {errores.telefono && (
            <span className="mt-1 block text-xs font-medium text-red-600">{errores.telefono}</span>
          )}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-tinta-700">Dirección</span>
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="campo-input"
            placeholder="Ej. Calle 18 #25-10, Pasto"
          />
        </label>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-tinta-700">
          Ubicación en el mapa
        </span>
        <MapaSelector
          lat={ubicacion?.lat ?? null}
          lng={ubicacion?.lng ?? null}
          color="#22A67A"
          onCambiar={(lat, lng) => setUbicacion({ lat, lng })}
        />
        {errores.latitud ? (
          <p className="mt-1.5 text-xs font-medium text-red-600">{errores.latitud}</p>
        ) : (
          !ubicacion && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-tinta-500">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Toca el mapa donde queda tu local.
            </p>
          )
        )}
      </div>

      {error && <Alerta>{error}</Alerta>}
      {mensaje && <p className="text-sm font-medium text-encontrada-700">{mensaje}</p>}

      <button type="submit" disabled={guardando} className="boton-primario w-full py-3">
        {guardando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="h-4 w-4" aria-hidden="true" />
        )}
        Guardar datos del local
      </button>
    </form>
  );
}
