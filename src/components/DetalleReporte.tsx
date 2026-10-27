"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CircleCheckBig,
  Mail,
  MapPin,
  MapPinned,
  Megaphone,
  PartyPopper,
  Phone,
  UserRound,
  EyeOff,
} from "lucide-react";
import AccionesAdmin from "@/components/AccionesAdmin";
import BotonRenovar from "@/components/BotonRenovar";
import MensajesReporte from "@/components/MensajesReporte";
import PanelAlertas from "@/components/PanelAlertas";
import type { AlertaReporte } from "@/lib/alertas";
import { ESTILO_TIPO, EtiquetaEstado, EtiquetaTipo } from "@/components/Etiquetas";
import { formatearFecha, formatearFechaHora, formatearHora, haceCuanto } from "@/lib/formato";
import { ETIQUETA_TAMANO, type Reporte } from "@/lib/tipos";

const MapaVisor = dynamic(() => import("@/components/MapaVisor"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-2xl bg-tinta-100" />,
});

export default function DetalleReporte({
  reporte,
  aviso,
  esAdmin,
  alertas,
  puedeGestionar,
  puedeRenovar,
}: {
  reporte: Reporte;
  aviso: "nuevo" | "editado" | null;
  esAdmin: boolean;
  alertas: AlertaReporte[];
  // El dueño (cuenta con la que se publicó) o el admin.
  puedeGestionar: boolean;
  puedeRenovar: boolean;
}) {
  const estilo = ESTILO_TIPO[reporte.tipo];
  const reencontrada = reporte.estado === "REENCONTRADA";
  const titulo =
    reporte.nombre || `${reporte.especie} ${estilo.etiqueta.toLowerCase()}`;
  const hayContacto =
    reporte.contactoNombre || reporte.contactoTelefono || reporte.contactoEmail;

  return (
    <div className="space-y-6">
      <Link
        href="/reportes"
        className="inline-flex items-center gap-2 text-sm font-semibold text-tinta-500 transition hover:gap-3 hover:text-tinta-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a los reportes
      </Link>

      {aviso && (
        <div
          role="status"
          className="flex animate-aparecer items-center gap-3 rounded-2xl border border-encontrada-200 bg-encontrada-50 px-4 py-3 text-sm font-semibold text-encontrada-800"
        >
          <CircleCheckBig className="h-5 w-5 shrink-0" aria-hidden="true" />
          {aviso === "nuevo"
            ? "¡Reporte publicado con éxito! Ya está visible para toda la comunidad."
            : "Cambios guardados. El reporte ya muestra la información actualizada."}
        </div>
      )}

      {reencontrada && (
        <div className="relative animate-aparecer overflow-hidden rounded-3xl bg-gradient-to-r from-reencontrada-500 via-reencontrada-600 to-perdida-500 p-6 text-white shadow-brillo-lavanda">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 right-20 h-24 w-24 rounded-full bg-sol-300/30" />
          <div className="relative flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 animate-latido items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <PartyPopper className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-xl font-bold sm:text-2xl">
                ¡{reporte.nombre || "Esta mascota"} ya está en casa!
              </p>
              <p className="text-sm text-white/85">
                Caso cerrado
                {reporte.reencontradaEn &&
                  ` el ${formatearFechaHora(reporte.reencontradaEn)}`}
                . Gracias a todos los que ayudaron a difundirlo.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-4xl bg-tinta-100 shadow-elevada">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reporte.fotoUrl}
              alt={`Fotografía de ${titulo}`}
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <EtiquetaTipo tipo={reporte.tipo} larga />
              <EtiquetaEstado estado={reporte.estado} />
            </div>
          </div>

          <section className="tarjeta p-6">
            <h1 className="titulo-display text-3xl sm:text-4xl">{titulo}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-tinta-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-perdida-400" aria-hidden="true" />
                {reporte.zona}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-reencontrada-400" aria-hidden="true" />
                {reporte.tipo === "PERDIDA" ? "Se perdió el " : "Encontrada el "}
                {formatearFecha(reporte.fecha, "larga")} a las {formatearHora(reporte.fecha)}
              </span>
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                etiqueta="Publicado"
                valor={formatearFechaHora(reporte.creadoEn, "corta")}
              />
            </dl>

            {reporte.senasParticulares && (
              <div className="mt-6 rounded-2xl bg-crema-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-perdida-700">
                  Señas particulares
                </p>
                <p className="mt-1 whitespace-pre-line text-tinta-700">
                  {reporte.senasParticulares}
                </p>
              </div>
            )}

          </section>

          {!reencontrada && <PanelAlertas reporte={reporte} alertas={alertas} />}

          <MensajesReporte reporteId={reporte.id} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {esAdmin && <AccionesAdmin id={reporte.id} estado={reporte.estado} />}

          {puedeGestionar && reporte.estado === "ACTIVO" && (
            <section className="tarjeta space-y-3 p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <Megaphone className="h-5 w-5 text-perdida-500" aria-hidden="true" />
                Difusión del caso
              </h2>
              <p className="text-sm text-tinta-500">
                Última difusión: {haceCuanto(reporte.renovadoEn).toLowerCase()}
                {reporte.renovaciones > 0 &&
                  ` · renovado ${reporte.renovaciones} ${reporte.renovaciones === 1 ? "vez" : "veces"}`}
                . Mientras no aparezca, confirma que sigue abierto para que vuelva a subir en el
                listado y a avisar a quienes viven cerca.
              </p>
              {puedeRenovar ? (
                <BotonRenovar id={reporte.id} />
              ) : (
                <p className="rounded-2xl bg-tinta-50 p-3 text-sm text-tinta-500">
                  Ya se difundió hoy. Podrás renovarlo de nuevo mañana.
                </p>
              )}
            </section>
          )}

          <section className="tarjeta p-5">
            <h2 className="font-display text-lg font-bold">
              {reporte.tipo === "PERDIDA" ? "¿La has visto?" : "¿Es tu mascota?"}
            </h2>
            <p className="mt-1 text-sm text-tinta-500">
              {reporte.tipo === "PERDIDA"
                ? "Contacta a su familia, cada pista cuenta."
                : "Contacta a quien la encontró."}
            </p>

            {reporte.reportanteAnonimo || !hayContacto ? (
              <p className="mt-4 flex items-start gap-3 rounded-2xl bg-tinta-50 p-4 text-sm text-tinta-500">
                <EyeOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {reporte.reportanteAnonimo
                  ? "Reporte anónimo: esta persona prefirió no dejar datos de contacto."
                  : "Este reporte no tiene datos de contacto."}
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {reporte.contactoNombre && (
                  <FilaContacto Icono={UserRound} texto={reporte.contactoNombre} />
                )}
                {reporte.contactoTelefono && (
                  <FilaContacto
                    Icono={Phone}
                    texto={reporte.contactoTelefono}
                    href={`tel:${reporte.contactoTelefono.replace(/\s/g, "")}`}
                  />
                )}
                {reporte.contactoEmail && (
                  <FilaContacto
                    Icono={Mail}
                    texto={reporte.contactoEmail}
                    href={`mailto:${reporte.contactoEmail}`}
                  />
                )}
              </ul>
            )}
          </section>

          {reporte.tipo === "ENCONTRADA" && !reencontrada && (
            <Link
              href="/donde-acudir"
              className="tarjeta flex items-start gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-suave"
            >
              <MapPinned className="mt-0.5 h-5 w-5 shrink-0 text-encontrada-600" aria-hidden="true" />
              <span>
                <span className="block font-display text-base font-bold text-tinta-900">
                  ¿No puedes quedarte con ella?
                </span>
                <span className="block text-sm text-tinta-500">
                  Mira qué veterinarias y refugios cercanos reciben mascotas encontradas.
                </span>
              </span>
            </Link>
          )}

          <section className="tarjeta p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
              <MapPin className="h-5 w-5 text-perdida-500" aria-hidden="true" />
              Última ubicación conocida
            </h2>
            <MapaVisor
              lat={reporte.latitud}
              lng={reporte.longitud}
              color={estilo.colorMapa}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-tinta-100 bg-tinta-50/60 px-4 py-3">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-tinta-400">
        {etiqueta}
      </dt>
      <dd className="mt-0.5 break-words font-semibold text-tinta-800">{valor}</dd>
    </div>
  );
}

function FilaContacto({
  Icono,
  texto,
  href,
}: {
  Icono: typeof Phone;
  texto: string;
  href?: string;
}) {
  const contenido = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-perdida-500 shadow-sm">
        <Icono className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="truncate">{texto}</span>
    </>
  );
  const clase =
    "flex items-center gap-3 rounded-2xl bg-crema-100 px-3 py-2.5 text-sm font-semibold text-tinta-800";

  return (
    <li>
      {href ? (
        <a href={href} className={`${clase} transition hover:bg-crema-200`}>
          {contenido}
        </a>
      ) : (
        <div className={clase}>{contenido}</div>
      )}
    </li>
  );
}
