import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, MapPinned, Pencil, QrCode, Radar } from "lucide-react";
import BotonRenovar from "@/components/BotonRenovar";
import BotonYaAparecio from "@/components/BotonYaAparecio";
import BotonCerrarSesionCuenta from "@/components/BotonCerrarSesionCuenta";
import ControlSuscripcion from "@/components/ControlSuscripcion";
import { EtiquetaEstado, EtiquetaTipo } from "@/components/Etiquetas";
import { usuarioActual } from "@/lib/cuenta";
import { distanciaKm, formatearDistancia } from "@/lib/coincidencias";
import { prisma } from "@/lib/db";
import { rutaPanel } from "@/lib/roles";
import { formatearFechaHora, haceCuanto } from "@/lib/formato";
import { necesitaRecordatorio, puedeRenovar } from "@/lib/renovacion";

export const metadata = {
  title: "Tu cuenta — PetMatch",
};

// HU-16: panel del ciudadano suscrito a avisos de cercanía.
export default async function CuentaPage() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/cuenta/login");
  if (usuario.rol !== "CIUDADANO") redirect(rutaPanel(usuario.rol));

  const misReportes = await prisma.reporte.findMany({
    where: { usuarioId: usuario.id },
    orderBy: { renovadoEn: "desc" },
    take: 30,
  });

  const misMascotas = await prisma.mascota.findMany({
    where: { usuarioId: usuario.id },
    orderBy: { creadoEn: "desc" },
  });

  const suscrito =
    usuario.avisoLatitud !== null &&
    usuario.avisoLongitud !== null &&
    usuario.avisoRadioKm !== null;

  const cercanos = suscrito
    ? (
        await prisma.reporte.findMany({
          where: { tipo: "PERDIDA", estado: "ACTIVO" },
          orderBy: { creadoEn: "desc" },
        })
      )
        .map((reporte) => ({
          reporte,
          distancia: distanciaKm(
            { latitud: usuario.avisoLatitud!, longitud: usuario.avisoLongitud! },
            reporte
          ),
        }))
        .filter((r) => r.distancia <= usuario.avisoRadioKm!)
        .sort((a, b) => a.distancia - b.distancia)
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-reencontrada-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-reencontrada-700 ring-1 ring-reencontrada-200">
            <Radar className="h-3.5 w-3.5" aria-hidden="true" />
            Cuenta de ciudadano
          </p>
          <h1 className="titulo-display text-3xl">Hola, {usuario.nombre}</h1>
        </div>
        <BotonCerrarSesionCuenta />
      </header>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <FileText className="h-5 w-5 text-perdida-500" aria-hidden="true" />
          Mis reportes ({misReportes.length})
        </h2>
        {misReportes.length === 0 ? (
          <div className="tarjeta px-6 py-8 text-center text-sm text-tinta-500">
            Los reportes que publiques con tu sesión iniciada aparecerán aquí, y podrás
            renovarlos mientras tu mascota no aparezca.{" "}
            <Link href="/perdida/nuevo" className="font-semibold text-perdida-600 underline">
              Reportar una mascota perdida
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {misReportes.map((reporte) => (
              <li key={reporte.id} className="tarjeta flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                <Link href={`/reportes/${reporte.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={reporte.fotoUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="truncate font-display font-bold text-tinta-900">
                      {reporte.nombre || reporte.especie}
                    </p>
                    <p className="truncate text-xs text-tinta-500">
                      Difundido {haceCuanto(reporte.renovadoEn).toLowerCase()}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <EtiquetaTipo tipo={reporte.tipo} />
                      <EtiquetaEstado estado={reporte.estado} />
                      {necesitaRecordatorio(reporte) && (
                        <span className="rounded-full bg-perdida-100 px-2 py-0.5 text-[11px] font-bold text-perdida-700">
                          ¿Sigue perdida?
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  {reporte.tipo === "PERDIDA" && reporte.estado === "ACTIVO" && (
                    <BotonYaAparecio id={reporte.id} compacto />
                  )}
                  {reporte.tipo === "PERDIDA" && puedeRenovar(reporte) && (
                    <BotonRenovar id={reporte.id} compacto />
                  )}
                  <Link
                    href={`/reportes/${reporte.id}/editar`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-tinta-200 bg-white px-3 py-1.5 text-xs font-bold text-tinta-600 transition hover:border-tinta-300"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <QrCode className="h-5 w-5 text-reencontrada-500" aria-hidden="true" />
          Mis mascotas con placa QR ({misMascotas.length})
        </h2>
        {misMascotas.length === 0 ? (
          <div className="tarjeta px-6 py-8 text-center text-sm text-tinta-500">
            Los perfiles que crees con tu sesión iniciada aparecerán aquí para que puedas
            actualizar su foto y tu contacto.{" "}
            <Link href="/mascotas/nueva" className="font-semibold text-perdida-600 underline">
              Crear una placa
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {misMascotas.map((mascota) => (
              <li key={mascota.id} className="tarjeta flex items-center gap-3 p-3">
                <Link href={`/mascotas/${mascota.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mascota.fotoUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="truncate font-display font-bold text-tinta-900">{mascota.nombre}</p>
                    <p className="truncate text-xs text-tinta-500">
                      {mascota.especie} · {mascota.contactoTelefono}
                    </p>
                  </div>
                </Link>
                <Link
                  href={`/mascotas/${mascota.id}/editar`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-tinta-200 bg-white px-3 py-1.5 text-xs font-bold text-tinta-600 transition hover:border-tinta-300"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="tarjeta p-6">
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold">
          <MapPinned className="h-5 w-5 text-reencontrada-500" aria-hidden="true" />
          Avisos de cercanía
        </h2>
        <p className="mb-4 text-sm text-tinta-500">
          Marca un punto y un radio en kilómetros: te avisaremos en la campana del menú
          cuando se publique una mascota perdida dentro de esa zona, aunque tú no hayas
          perdido ninguna.
        </p>
        <ControlSuscripcion
          inicial={{
            latitud: usuario.avisoLatitud,
            longitud: usuario.avisoLongitud,
            radioKm: usuario.avisoRadioKm,
          }}
        />
      </section>

      {suscrito && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold">
            Mascotas perdidas a {usuario.avisoRadioKm} km o menos ({cercanos.length})
          </h2>
          {cercanos.length === 0 ? (
            <div className="tarjeta px-6 py-10 text-center text-tinta-500">
              No hay reportes dentro de tu radio por ahora.
            </div>
          ) : (
            <ul className="space-y-2">
              {cercanos.map(({ reporte, distancia }) => (
                <li key={reporte.id}>
                  <Link
                    href={`/reportes/${reporte.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-tinta-100 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-suave"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={reporte.fotoUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-bold text-tinta-900">
                        {reporte.nombre || reporte.especie}
                      </p>
                      <p className="truncate text-xs text-tinta-500">
                        {reporte.zona} · {formatearFechaHora(reporte.fecha, "corta")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <EtiquetaTipo tipo={reporte.tipo} />
                      <span className="text-xs font-bold text-reencontrada-600">
                        {formatearDistancia(distancia)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
