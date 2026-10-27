import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, MapPinned, Radar } from "lucide-react";
import BotonCerrarSesionCuenta from "@/components/BotonCerrarSesionCuenta";
import ControlSuscripcion from "@/components/ControlSuscripcion";
import { EtiquetaTipo } from "@/components/Etiquetas";
import { usuarioActual } from "@/lib/cuenta";
import { distanciaKm, formatearDistancia } from "@/lib/coincidencias";
import { prisma } from "@/lib/db";
import { rutaPanel } from "@/lib/roles";
import { formatearFechaHora } from "@/lib/formato";

export const metadata = {
  title: "Tu cuenta — PetMatch",
};

// HU-16: panel del ciudadano suscrito a avisos de cercanía.
export default async function CuentaPage() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/cuenta/login");
  if (usuario.rol !== "CIUDADANO") redirect(rutaPanel(usuario.rol));

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
