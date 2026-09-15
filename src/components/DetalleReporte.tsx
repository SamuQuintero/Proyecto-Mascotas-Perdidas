"use client";

import dynamic from "next/dynamic";
import { ETIQUETA_TAMANO, type Reporte } from "@/lib/tipos";

const MapaVisor = dynamic(() => import("@/components/MapaVisor"), {
  ssr: false,
});

const ESTILO_TIPO = {
  PERDIDA: {
    etiqueta: "Mascota perdida",
    clase: "bg-perdida-100 text-perdida-700",
    color: "#f97316",
  },
  ENCONTRADA: {
    etiqueta: "Mascota encontrada",
    clase: "bg-encontrada-100 text-encontrada-700",
    color: "#10b981",
  },
} as const;

export default function DetalleReporte({
  reporte,
  esNuevo,
}: {
  reporte: Reporte;
  esNuevo: boolean;
}) {
  const estilo = ESTILO_TIPO[reporte.tipo];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {esNuevo && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          ✅ ¡Reporte publicado con éxito! Ya está visible para otras personas.
        </div>
      )}

      <div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${estilo.clase}`}
        >
          {estilo.etiqueta}
        </span>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {reporte.nombre || `${reporte.especie} ${estilo.etiqueta.toLowerCase()}`}
        </h1>
      </div>

      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={reporte.fotoUrl}
          alt={`Fotografía de ${reporte.especie.toLowerCase()}`}
          className="h-72 w-full rounded-xl object-cover"
        />

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Dato etiqueta="Especie" valor={reporte.especie} />
          <Dato etiqueta="Raza" valor={reporte.raza || "No especificada"} />
          <Dato etiqueta="Color" valor={reporte.color} />
          <Dato etiqueta="Tamaño" valor={ETIQUETA_TAMANO[reporte.tamano]} />
          <Dato
            etiqueta="Collar"
            valor={
              reporte.tieneCollar === true
                ? "Sí"
                : reporte.tieneCollar === false
                  ? "No"
                  : "No se sabe"
            }
          />
          <Dato
            etiqueta="Fecha"
            valor={new Date(reporte.fecha).toLocaleDateString("es-CO")}
          />
          <Dato etiqueta="Zona" valor={reporte.zona} />
        </dl>

        {reporte.senasParticulares && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              Señas particulares
            </dt>
            <dd className="text-slate-800">{reporte.senasParticulares}</dd>
          </div>
        )}

        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Última ubicación conocida
          </h2>
          <MapaVisor
            lat={reporte.latitud}
            lng={reporte.longitud}
            color={estilo.color}
          />
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Contacto
          </h2>
          {reporte.reportanteAnonimo ? (
            <p className="text-sm text-slate-500">
              Reporte anónimo. Esta persona no dejó datos de contacto.
            </p>
          ) : (
            <ul className="space-y-1 text-sm text-slate-700">
              {reporte.contactoNombre && <li>👤 {reporte.contactoNombre}</li>}
              {reporte.contactoTelefono && (
                <li>📞 {reporte.contactoTelefono}</li>
              )}
              {reporte.contactoEmail && <li>✉️ {reporte.contactoEmail}</li>}
              {!reporte.contactoNombre &&
                !reporte.contactoTelefono &&
                !reporte.contactoEmail && (
                  <li className="text-slate-500">Sin datos de contacto.</li>
                )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">
        {etiqueta}
      </dt>
      <dd className="text-slate-800">{valor}</dd>
    </div>
  );
}
