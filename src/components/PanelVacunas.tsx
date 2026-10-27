"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus, Syringe, Trash2 } from "lucide-react";
import { fechaParaInput, formatearFecha } from "@/lib/formato";

interface Vacuna {
  id: string;
  nombre: string;
  fecha: string;
  veterinaria: string;
}

// HU-17: la veterinaria lleva el carnet de vacunas de una mascota (perfil
// con QR, HU-8) sin poder tocar los reportes — es una vista y gestión
// completamente aparte del panel de administración.
export default function PanelVacunas({
  mascotaId,
  vacunasIniciales,
}: {
  mascotaId: string;
  vacunasIniciales: Vacuna[];
}) {
  const router = useRouter();
  const [vacunas, setVacunas] = useState(vacunasIniciales);
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState(fechaParaInput(new Date()));
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function agregar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!nombre.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/mascotas/${mascotaId}/vacunas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, fecha }),
      });
      const data = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(data.errores?.nombre ?? data.errores?.fecha ?? data.error ?? "No se pudo registrar.");
        return;
      }
      setVacunas((anteriores) => [data.vacuna, ...anteriores]);
      setNombre("");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(vacunaId: string) {
    setBorrando(vacunaId);
    try {
      const respuesta = await fetch(`/api/mascotas/${mascotaId}/vacunas/${vacunaId}`, {
        method: "DELETE",
      });
      if (respuesta.ok) {
        setVacunas((anteriores) => anteriores.filter((v) => v.id !== vacunaId));
        router.refresh();
      }
    } finally {
      setBorrando(null);
    }
  }

  return (
    <div className="space-y-3">
      {vacunas.length === 0 ? (
        <p className="rounded-2xl bg-crema-100 p-3 text-sm text-tinta-500">
          Esta mascota todavía no tiene vacunas registradas.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {vacunas.map((vacuna) => (
            <li
              key={vacuna.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-crema-100 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <span className="font-semibold text-tinta-800">{vacuna.nombre}</span>
                <span className="text-tinta-500"> · {formatearFecha(vacuna.fecha)}</span>
              </div>
              <button
                onClick={() => borrar(vacuna.id)}
                disabled={borrando === vacuna.id}
                className="shrink-0 rounded-lg p-1.5 text-tinta-400 hover:bg-white hover:text-red-600"
                aria-label={`Borrar ${vacuna.nombre}`}
              >
                {borrando === vacuna.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={agregar} className="flex flex-wrap items-end gap-2">
        <label className="flex-1 basis-40">
          <span className="mb-1 block text-xs font-semibold text-tinta-500">Vacuna</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Rabia"
            className="w-full rounded-lg border border-tinta-200 px-2.5 py-1.5 text-sm"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold text-tinta-500">Fecha</span>
          <input
            type="date"
            value={fecha}
            max={fechaParaInput(new Date())}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-lg border border-tinta-200 px-2.5 py-1.5 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={guardando || !nombre.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-encontrada-500 px-3 py-2 text-xs font-bold text-white hover:bg-encontrada-600 disabled:opacity-60"
        >
          {guardando ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Registrar
        </button>
      </form>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
