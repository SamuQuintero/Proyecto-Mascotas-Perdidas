"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, BellOff, Loader2, MapPin } from "lucide-react";

const MapaSelector = dynamic(() => import("@/components/MapaSelector"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 animate-pulse items-center justify-center rounded-2xl bg-tinta-100 text-sm text-tinta-400">
      Cargando mapa…
    </div>
  ),
});

interface Props {
  inicial: { latitud: number | null; longitud: number | null; radioKm: number | null };
}

// HU-16: el ciudadano marca un punto en el mapa y ajusta con un control
// deslizante (en km) el radio en el que quiere recibir avisos de mascotas
// perdidas. Reutiliza el mismo MapaSelector de los formularios de reporte.
export default function ControlSuscripcion({ inicial }: Props) {
  const router = useRouter();
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(
    inicial.latitud !== null && inicial.longitud !== null
      ? { lat: inicial.latitud, lng: inicial.longitud }
      : null
  );
  const [radioKm, setRadioKm] = useState(inicial.radioKm ?? 5);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const activa = inicial.latitud !== null;

  async function guardar() {
    if (!ubicacion) {
      setMensaje("Marca primero un punto en el mapa.");
      return;
    }
    setGuardando(true);
    setMensaje(null);
    try {
      const respuesta = await fetch("/api/cuenta/suscripcion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitud: ubicacion.lat, longitud: ubicacion.lng, radioKm }),
      });
      if (!respuesta.ok) {
        setMensaje("No se pudo guardar. Intenta de nuevo.");
        return;
      }
      setMensaje("Listo: te avisaremos de mascotas perdidas en ese radio.");
      router.refresh();
    } finally {
      setGuardando(false);
    }
  }

  async function desactivar() {
    setGuardando(true);
    try {
      await fetch("/api/cuenta/suscripcion", { method: "DELETE" });
      setUbicacion(null);
      setMensaje("Avisos desactivados.");
      router.refresh();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="mb-1.5 block text-sm font-semibold text-tinta-700">
          Tu punto de referencia
        </span>
        <MapaSelector
          lat={ubicacion?.lat ?? null}
          lng={ubicacion?.lng ?? null}
          color="#7D5CF6"
          onCambiar={(lat, lng) => setUbicacion({ lat, lng })}
        />
        {!ubicacion && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-tinta-500">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            Sin marcar, el mapa muestra el centro de Pasto por defecto.
          </p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-tinta-700">Radio de aviso</span>
          <span className="rounded-full bg-reencontrada-100 px-2.5 py-0.5 text-sm font-bold text-reencontrada-700">
            {radioKm} km
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={50}
          value={radioKm}
          onChange={(e) => setRadioKm(Number(e.target.value))}
          className="w-full accent-reencontrada-500"
        />
        <div className="flex justify-between text-xs text-tinta-400">
          <span>1 km</span>
          <span>50 km</span>
        </div>
      </div>

      {mensaje && <p className="text-sm font-medium text-tinta-600">{mensaje}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        {activa && (
          <button
            type="button"
            onClick={desactivar}
            disabled={guardando}
            className="boton-secundario flex-1"
          >
            <BellOff className="h-4 w-4" aria-hidden="true" />
            Desactivar avisos
          </button>
        )}
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="boton flex-1 bg-gradient-to-r from-reencontrada-500 to-reencontrada-600 text-white shadow-brillo-lavanda hover:-translate-y-0.5 focus-visible:ring-reencontrada-200"
        >
          {guardando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Bell className="h-4 w-4" aria-hidden="true" />
          )}
          {activa ? "Actualizar" : "Activar avisos"}
        </button>
      </div>
    </div>
  );
}
