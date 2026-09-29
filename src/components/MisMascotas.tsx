"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { misMascotas } from "@/lib/dispositivo";

interface Resumen {
  id: string;
  nombre: string;
  especie: string;
  fotoUrl: string;
}

// Perfiles de mascota creados desde este dispositivo, para volver a
// imprimir su placa sin tener que guardar el enlace.
export default function MisMascotas() {
  const [mascotas, setMascotas] = useState<Resumen[]>([]);

  useEffect(() => {
    const ids = misMascotas();
    if (ids.length === 0) return;
    fetch(`/api/mascotas?ids=${ids.join(",")}`)
      .then((r) => (r.ok ? r.json() : { mascotas: [] }))
      .then((datos) => setMascotas(datos.mascotas))
      .catch(() => {});
  }, []);

  if (mascotas.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="titulo-display text-2xl">Tus mascotas</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mascotas.map((mascota) => (
          <li key={mascota.id} className="tarjeta flex items-center gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mascota.fotoUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded-2xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/mascotas/${mascota.id}`}
                className="block truncate font-display text-lg font-bold text-tinta-900 hover:underline"
              >
                {mascota.nombre}
              </Link>
              <p className="text-sm text-tinta-500">{mascota.especie}</p>
            </div>
            <Link
              href={`/mascotas/${mascota.id}/placa`}
              className="inline-flex items-center gap-1.5 rounded-full bg-tinta-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-tinta-700"
            >
              <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
              Placa
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
