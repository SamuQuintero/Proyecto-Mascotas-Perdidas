"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { BellRing, MapPin, Radar, Sparkles } from "lucide-react";
import { ESTILO_TIPO } from "@/components/Etiquetas";
import { RADIO_CERCANIA_KM, formatearDistancia } from "@/lib/coincidencias";
import { haceCuanto } from "@/lib/formato";
import type { AlertaReporte } from "@/lib/alertas";
import type { Reporte } from "@/lib/tipos";

const MapaCercania = dynamic(() => import("@/components/MapaCercania"), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-2xl bg-tinta-100" />,
});

// Alertas de un reporte en su página de detalle:
// - HU-4: reportes del tipo contrario cuyas características coinciden.
// - HU-7: reportes del tipo contrario hechos cerca del lugar.
export default function PanelAlertas({
  reporte,
  alertas,
}: {
  reporte: Reporte;
  alertas: AlertaReporte[];
}) {
  const esPerdida = reporte.tipo === "PERDIDA";
  const nombre = reporte.nombre || `esta mascota`;
  const coincidencias = alertas.filter((a) => a.esCoincidencia);
  const cercanos = alertas
    .filter((a) => a.esCercano)
    .sort((a, b) => a.distanciaKm - b.distanciaKm);
  const colorOtro = ESTILO_TIPO[esPerdida ? "ENCONTRADA" : "PERDIDA"].colorMapa;

  return (
    <section className="tarjeta space-y-6 p-6" aria-labelledby="titulo-alertas">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sol-300 to-perdida-500 text-white shadow-brillo">
          <BellRing className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="titulo-alertas" className="font-display text-xl font-bold text-tinta-900">
            {esPerdida ? `Alertas para ${nombre}` : "¿Es alguna de estas mascotas perdidas?"}
          </h2>
          <p className="text-sm text-tinta-500">
            {esPerdida
              ? "Hallazgos que se le parecen o que se reportaron cerca de donde se perdió."
              : "Mascotas perdidas que se parecen a esta o que se perdieron cerca de aquí."}
          </p>
        </div>
      </div>

      {alertas.length === 0 && (
        <p className="rounded-2xl bg-crema-100 p-4 text-sm text-tinta-600">
          {esPerdida
            ? "Todavía no hay hallazgos parecidos ni cercanos. Si publicaste este reporte desde este dispositivo, la campana del menú te avisará apenas aparezca uno."
            : "Por ahora ninguna mascota perdida coincide con este hallazgo."}
        </p>
      )}

      {coincidencias.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-reencontrada-600">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Se parecen ({coincidencias.length})
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {coincidencias.map((alerta) => (
              <li key={alerta.reporte.id}>
                <TarjetaAlerta alerta={alerta} mostrarPuntaje />
              </li>
            ))}
          </ul>
        </div>
      )}

      {cercanos.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-perdida-600">
            <Radar className="h-4 w-4" aria-hidden="true" />
            A menos de {RADIO_CERCANIA_KM} km ({cercanos.length})
          </h3>
          <MapaCercania
            centro={{ lat: reporte.latitud, lng: reporte.longitud }}
            colorCentro={ESTILO_TIPO[reporte.tipo].colorMapa}
            colorPuntos={colorOtro}
            puntos={cercanos.map((a) => ({
              id: a.reporte.id,
              lat: a.reporte.latitud,
              lng: a.reporte.longitud,
              titulo: a.reporte.nombre || a.reporte.especie,
              distanciaKm: a.distanciaKm,
            }))}
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {cercanos
              .filter((a) => !a.esCoincidencia)
              .map((alerta) => (
                <li key={alerta.reporte.id}>
                  <TarjetaAlerta alerta={alerta} />
                </li>
              ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function TarjetaAlerta({
  alerta,
  mostrarPuntaje,
}: {
  alerta: AlertaReporte;
  mostrarPuntaje?: boolean;
}) {
  const otro = alerta.reporte;
  return (
    <Link
      href={`/reportes/${otro.id}`}
      className="group flex gap-3 rounded-2xl border border-tinta-100 bg-white p-3 transition hover:-translate-y-0.5 hover:border-tinta-200 hover:shadow-suave"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={otro.fotoUrl}
        alt={`Fotografía de ${otro.nombre || otro.especie}`}
        className="h-20 w-20 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-display font-bold text-tinta-900">
            {otro.nombre || otro.especie}
          </p>
          {mostrarPuntaje && (
            <span className="shrink-0 rounded-full bg-reencontrada-100 px-2 py-0.5 text-[11px] font-bold text-reencontrada-700">
              {alerta.puntaje}% parecido
            </span>
          )}
        </div>
        <p className="truncate text-xs text-tinta-500" suppressHydrationWarning>
          {otro.color} · {otro.zona} · {haceCuanto(otro.creadoEn)}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {alerta.esCercano && (
            <span className="inline-flex items-center gap-1 rounded-full bg-perdida-100 px-2 py-0.5 text-[11px] font-bold text-perdida-700">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {formatearDistancia(alerta.distanciaKm)}
            </span>
          )}
          {alerta.razones
            .filter((razon) => !razon.startsWith("A ") && razon !== "En el mismo lugar")
            .map((razon) => (
              <span
                key={razon}
                className="rounded-full bg-tinta-100 px-2 py-0.5 text-[11px] font-medium text-tinta-600"
              >
                {razon}
              </span>
            ))}
        </div>
      </div>
    </Link>
  );
}
