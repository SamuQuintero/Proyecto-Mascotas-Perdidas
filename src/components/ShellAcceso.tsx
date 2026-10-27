import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Cat,
  Dog,
  Heart,
  Home,
  MapPin,
  PawPrint,
  QrCode,
  ShieldCheck,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

type Variante = "cuenta" | "registro" | "admin";

interface Configuracion {
  fondo: string;
  brillo: string;
  titulo: string;
  texto: string;
  puntos: { Icono: LucideIcon; texto: string }[];
}

const VARIANTES: Record<Variante, Configuracion> = {
  cuenta: {
    fondo: "from-perdida-500 via-perdida-400 to-reencontrada-500",
    brillo: "bg-sol-300/40",
    titulo: "Cada mascota merece volver a casa.",
    texto: "Entra para seguir tus casos, recibir avisos cerca de ti y ayudar a otros a reencontrarse.",
    puntos: [
      { Icono: Bell, texto: "Avisos de mascotas perdidas en tu zona" },
      { Icono: QrCode, texto: "Placa con QR y carnet de vacunas" },
      { Icono: Home, texto: "Refugios y veterinarias, en un solo lugar" },
    ],
  },
  registro: {
    fondo: "from-encontrada-600 via-encontrada-500 to-reencontrada-500",
    brillo: "bg-sol-300/35",
    titulo: "Súmate a la comunidad que los reencuentra.",
    texto: "Una cuenta gratis te deja renovar y editar tus reportes, y recibir avisos de tu barrio.",
    puntos: [
      { Icono: Heart, texto: "Sin costo y en menos de un minuto" },
      { Icono: MapPin, texto: "Avisos a la distancia que tú elijas" },
      { Icono: Stethoscope, texto: "Para ciudadanos, veterinarias y refugios" },
    ],
  },
  admin: {
    fondo: "from-tinta-900 via-reencontrada-800 to-reencontrada-600",
    brillo: "bg-perdida-400/25",
    titulo: "Panel de administración.",
    texto: "Revisa, corrige y celebra cada reencuentro. Acceso solo para el equipo de PetMatch.",
    puntos: [
      { Icono: ShieldCheck, texto: "Edita y cierra casos de cualquier reporte" },
      { Icono: BarChart3, texto: "Indicadores por especie, zona y tiempo" },
      { Icono: Heart, texto: "Cada cierre es una mascota que volvió a casa" },
    ],
  },
};

// Chips de cristal que flotan sobre el panel de marca.
const FLOTANTES: { Icono: LucideIcon; posicion: string; giro: string; retraso: string }[] = [
  { Icono: Dog, posicion: "right-[10%] top-[14%]", giro: "[--giro:8deg]", retraso: "0s" },
  { Icono: Cat, posicion: "right-[26%] bottom-[24%]", giro: "[--giro:-8deg]", retraso: "1.2s" },
  { Icono: Heart, posicion: "right-[8%] bottom-[10%]", giro: "[--giro:10deg]", retraso: "2.4s" },
  { Icono: MapPin, posicion: "left-[46%] top-[38%]", giro: "[--giro:-6deg]", retraso: "0.6s" },
];

// Marco compartido por las pantallas de acceso (inicio de sesión de cuentas
// y del administrador, y registro): panel de marca a la izquierda y el
// formulario a la derecha. En el celular el panel se reduce a una cabecera.
export default function ShellAcceso({
  variante,
  Icono,
  titulo,
  subtitulo,
  children,
  pie,
}: {
  variante: Variante;
  Icono: LucideIcon;
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
  pie?: React.ReactNode;
}) {
  const v = VARIANTES[variante];

  return (
    <div className="mx-auto max-w-5xl py-2">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-tinta-500 transition hover:gap-3 hover:text-tinta-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al inicio
      </Link>

      <div className="grid animate-aparecer overflow-hidden rounded-[2rem] bg-white shadow-elevada ring-1 ring-tinta-200/60 lg:grid-cols-[1.05fr_1fr]">
        <aside
          className={`relative isolate overflow-hidden bg-gradient-to-br ${v.fondo} p-7 text-white sm:p-10 lg:p-12`}
        >
          {/* Manchas que derivan despacio */}
          <div
            className={`absolute -left-20 -top-24 -z-10 h-72 w-72 animate-deriva rounded-full blur-3xl ${v.brillo}`}
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-28 right-[-4rem] -z-10 h-80 w-80 animate-deriva rounded-full bg-white/15 blur-3xl [animation-delay:-7s]"
            aria-hidden="true"
          />
          <PawPrint
            className="absolute -bottom-10 -left-8 -z-10 h-56 w-56 -rotate-12 text-white/10"
            aria-hidden="true"
          />
          <PawPrint
            className="absolute right-6 top-1/3 -z-10 hidden h-24 w-24 rotate-[18deg] text-white/10 lg:block"
            aria-hidden="true"
          />

          {FLOTANTES.map(({ Icono: Chip, posicion, giro, retraso }) => (
            <span
              key={posicion}
              style={{ animationDelay: retraso }}
              className={`absolute hidden h-14 w-14 animate-flotar items-center justify-center rounded-2xl border border-white/30 bg-white/15 text-white shadow-elevada backdrop-blur-md lg:flex ${posicion} ${giro}`}
              aria-hidden="true"
            >
              <Chip className="h-6 w-6" />
            </span>
          ))}

          <div className="relative flex h-full flex-col">
            <span className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/40 backdrop-blur">
                <PawPrint className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
              </span>
              <span className="font-display text-xl font-extrabold tracking-tight">PetMatch</span>
            </span>

            <div className="mt-8 lg:mt-20">
              <h2 className="max-w-sm font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
                {v.titulo}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85 sm:text-base">
                {v.texto}
              </p>
            </div>

            <ul className="mt-10 hidden space-y-3 lg:block">
              {v.puntos.map(({ Icono: Punto, texto }) => (
                <li key={texto} className="flex items-center gap-3 text-sm font-medium text-white/95">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur">
                    <Punto className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {texto}
                </li>
              ))}
            </ul>

            <p className="mt-auto hidden pt-12 text-xs font-medium text-white/65 lg:block">
              Hecho en Pasto, Nariño · para reencontrar a quienes más queremos.
            </p>
          </div>
        </aside>

        <section className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-tinta-800 to-tinta-900 text-white shadow-elevada">
            <Icono className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="titulo-display mt-5 text-3xl sm:text-4xl">{titulo}</h1>
          <p className="mb-7 mt-2 text-sm leading-relaxed text-tinta-500">{subtitulo}</p>
          {children}
          {pie && <div className="mt-6 text-center text-sm text-tinta-500">{pie}</div>}
        </section>
      </div>
    </div>
  );
}
