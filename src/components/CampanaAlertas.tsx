"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BellRing, MapPin, Sparkles, X } from "lucide-react";
import { formatearDistancia } from "@/lib/coincidencias";
import { haceCuanto } from "@/lib/formato";
import {
  EVENTO_CAMBIO,
  alertasVistas,
  claveAlerta,
  marcarAlertasVistas,
  misReportes,
} from "@/lib/dispositivo";
import type { EstadoReporte, TipoReporte } from "@/lib/tipos";

interface AlertaApi {
  id: string;
  titulo: string;
  color: string;
  zona: string;
  fotoUrl: string;
  creadoEn: string;
  esCoincidencia: boolean;
  esCercano: boolean;
  distanciaKm: number;
}

interface ReporteApi {
  id: string;
  tipo: TipoReporte;
  estado: EstadoReporte;
  titulo: string;
  alertas: AlertaApi[];
}

const INTERVALO_MS = 60 * 1000;

// Campana de notificaciones (HU-4 y HU-7). Consulta las alertas de los
// reportes publicados desde este dispositivo y muestra cuántas son nuevas.
export default function CampanaAlertas() {
  const pathname = usePathname();
  const [reportes, setReportes] = useState<ReporteApi[] | null>(null);
  const [vistas, setVistas] = useState<Set<string>>(new Set());
  const [abierta, setAbierta] = useState(false);
  // Alertas que eran nuevas al abrir el panel: siguen resaltadas mientras
  // está abierto, aunque ya se hayan marcado como vistas.
  const [resaltadas, setResaltadas] = useState<Set<string>>(new Set());
  const contenedor = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async () => {
    const ids = misReportes();
    setVistas(alertasVistas());
    if (ids.length === 0) {
      setReportes([]);
      return;
    }
    try {
      const respuesta = await fetch(`/api/alertas?ids=${ids.join(",")}`, {
        cache: "no-store",
      });
      if (respuesta.ok) setReportes((await respuesta.json()).reportes);
    } catch {
      // Sin conexión: se conserva lo último que se cargó.
    }
  }, []);

  useEffect(() => {
    cargar();
    const intervalo = window.setInterval(cargar, INTERVALO_MS);
    window.addEventListener("focus", cargar);
    window.addEventListener(EVENTO_CAMBIO, cargar);
    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("focus", cargar);
      window.removeEventListener(EVENTO_CAMBIO, cargar);
    };
  }, [cargar]);

  useEffect(() => setAbierta(false), [pathname]);

  // Cerrar al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!abierta) return;
    const alClic = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierta(false);
    };
    const alTecla = (evento: KeyboardEvent) => evento.key === "Escape" && setAbierta(false);
    document.addEventListener("mousedown", alClic);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("mousedown", alClic);
      document.removeEventListener("keydown", alTecla);
    };
  }, [abierta]);

  const conAlertas = (reportes ?? []).filter((r) => r.alertas.length > 0);
  const claves = conAlertas.flatMap((r) => r.alertas.map((a) => claveAlerta(r.id, a.id)));
  const nuevas = claves.filter((clave) => !vistas.has(clave)).length;

  function alternar() {
    const abrir = !abierta;
    setAbierta(abrir);
    if (abrir) {
      setResaltadas(new Set(claves.filter((clave) => !vistas.has(clave))));
      if (nuevas > 0) marcarAlertasVistas(claves);
    }
  }

  return (
    <div ref={contenedor} className="relative">
      <button
        onClick={alternar}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition hover:-translate-y-0.5 ${
          nuevas > 0
            ? "border-perdida-200 bg-perdida-50 text-perdida-600"
            : "border-tinta-200 bg-white/80 text-tinta-700 hover:border-tinta-300"
        }`}
        aria-label={nuevas > 0 ? `Alertas: ${nuevas} nuevas` : "Alertas"}
        aria-expanded={abierta}
      >
        {nuevas > 0 ? (
          <BellRing className="h-5 w-5 origin-top animate-[campana_1.2s_ease-in-out_3]" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {nuevas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-perdida-500 px-1 text-[11px] font-bold text-white ring-2 ring-crema-50">
            {nuevas > 9 ? "9+" : nuevas}
          </span>
        )}
      </button>

      {abierta && (
        <div className="fixed inset-x-3 top-[4.5rem] z-50 animate-aparecer overflow-hidden rounded-3xl border border-tinta-200/70 bg-white shadow-elevada sm:absolute sm:inset-x-auto sm:right-0 sm:top-14 sm:w-[24rem]">
          <div className="flex items-center justify-between border-b border-tinta-100 px-5 py-4">
            <div>
              <p className="font-display text-lg font-bold text-tinta-900">Alertas</p>
              <p className="text-xs text-tinta-500">
                Coincidencias y hallazgos cerca de tus reportes
              </p>
            </div>
            <button
              onClick={() => setAbierta(false)}
              className="rounded-full p-2 text-tinta-400 transition hover:bg-tinta-100 hover:text-tinta-700"
              aria-label="Cerrar alertas"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {reportes === null ? (
              <p className="px-5 py-8 text-center text-sm text-tinta-400">Cargando…</p>
            ) : reportes.length === 0 ? (
              <Vacio texto="Cuando publiques un reporte desde este dispositivo, aquí te avisaremos si aparece una mascota parecida o cerca del lugar." />
            ) : conAlertas.length === 0 ? (
              <Vacio texto="Todavía no hay coincidencias para tus reportes. Revisamos cada minuto: te avisaremos apenas aparezca algo." />
            ) : (
              conAlertas.map((reporte) => (
                <section key={reporte.id} className="border-b border-tinta-100 last:border-0">
                  <Link
                    href={`/reportes/${reporte.id}`}
                    className="block bg-crema-50 px-5 py-2 text-xs font-bold uppercase tracking-wider text-tinta-500 hover:text-tinta-800"
                  >
                    Tu reporte: {reporte.titulo} →
                  </Link>
                  <ul>
                    {reporte.alertas.map((alerta) => {
                      const nueva = resaltadas.has(claveAlerta(reporte.id, alerta.id));
                      return (
                        <li key={alerta.id}>
                          <Link
                            href={`/reportes/${alerta.id}`}
                            className={`flex gap-3 px-5 py-3 transition hover:bg-tinta-50 ${
                              nueva ? "bg-perdida-50/60" : ""
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={alerta.fotoUrl}
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-tinta-900">
                                {reporte.tipo === "PERDIDA"
                                  ? `Hallazgo: ${alerta.titulo}, ${alerta.color.toLowerCase()}`
                                  : `Buscan a ${alerta.titulo} (${alerta.color.toLowerCase()})`}
                              </p>
                              <p className="truncate text-xs text-tinta-500">
                                {alerta.zona} · {haceCuanto(alerta.creadoEn)}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {alerta.esCoincidencia && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-reencontrada-100 px-2 py-0.5 text-[11px] font-bold text-reencontrada-700">
                                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                                    Se parece
                                  </span>
                                )}
                                {alerta.esCercano && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-perdida-100 px-2 py-0.5 text-[11px] font-bold text-perdida-700">
                                    <MapPin className="h-3 w-3" aria-hidden="true" />
                                    A {formatearDistancia(alerta.distanciaKm)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {nueva && (
                              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-perdida-500" aria-label="Nueva" />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crema-100 text-perdida-500">
        <Bell className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="text-sm text-tinta-500">{texto}</p>
    </div>
  );
}
