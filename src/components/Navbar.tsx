"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Home,
  MapPinned,
  Plus,
  QrCode,
  Radar,
  Search,
  Stethoscope,
  UserCircle2,
  X,
} from "lucide-react";
import CampanaAlertas from "@/components/CampanaAlertas";
import Logo from "@/components/Logo";
import { rutaPanel, type RolCuenta } from "@/lib/roles";

const ENLACES = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/reportes", etiqueta: "Reportes" },
  { href: "/perdida/nuevo", etiqueta: "Perdí mi mascota" },
  { href: "/encontrada/nuevo", etiqueta: "Encontré una" },
  { href: "/mascotas", etiqueta: "Placa QR" },
  { href: "/donde-acudir", etiqueta: "Dónde acudir" },
  { href: "/resguardo", etiqueta: "En resguardo" },
];

export interface UsuarioNavbar {
  nombre: string;
  rol: RolCuenta;
}

// Navbar global. "Admin" y "Cuenta" son opcionales: nadie necesita iniciar
// sesión para usar la aplicación. Admin gestiona reportes; Cuenta es para
// ciudadanos que quieren avisos de cercanía (HU-16) o veterinarias que
// consultan reportes y llevan el carnet de vacunas (HU-17) — son sistemas
// de sesión independientes.
export default function Navbar({
  admin,
  usuario,
}: {
  admin: string | null;
  usuario: UsuarioNavbar | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [conSombra, setConSombra] = useState(false);

  useEffect(() => setMenuAbierto(false), [pathname]);

  useEffect(() => {
    const alDesplazar = () => setConSombra(window.scrollY > 8);
    alDesplazar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);

  async function cerrarSesion() {
    await fetch("/api/admin/sesion", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  async function cerrarSesionCuenta() {
    await fetch("/api/cuenta/sesion", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  const rutaCuenta = usuario ? rutaPanel(usuario.rol) : "/cuenta";

  function activo(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  // Pastilla oscura que se desliza hasta la sección activa, y una pastilla
  // clara que sigue al cursor entre los enlaces. Se miden en el DOM; hasta
  // que hay medida, el enlace activo lleva su propio fondo (sin JS también).
  const listaRef = useRef<HTMLUListElement>(null);
  const [pastilla, setPastilla] = useState<{ x: number; w: number } | null>(null);
  const [deslizar, setDeslizar] = useState(false);
  const [sombraCursor, setSombraCursor] = useState<{ x: number; w: number; desliza: boolean } | null>(
    null
  );

  const medirActivo = useCallback(() => {
    const enlace = listaRef.current?.querySelector<HTMLElement>('[data-activo="true"]');
    setPastilla(enlace ? { x: enlace.offsetLeft, w: enlace.offsetWidth } : null);
  }, []);

  useEffect(() => {
    medirActivo();
  }, [pathname, medirActivo]);

  useEffect(() => {
    const lista = listaRef.current;
    if (!lista) return;
    // Las fuentes web cambian el ancho de los enlaces al cargar.
    const observador = new ResizeObserver(medirActivo);
    observador.observe(lista);
    // La primera colocación es instantánea; desde ahí, la pastilla viaja.
    const temporizador = window.setTimeout(() => setDeslizar(true), 50);
    return () => {
      observador.disconnect();
      clearTimeout(temporizador);
    };
  }, [medirActivo]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300 print:hidden ${
        conSombra || menuAbierto
          ? "border-tinta-200/70 bg-crema-50/85 shadow-suave backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <div
        className="progreso-scroll absolute inset-x-0 bottom-[-1px] h-[2px] bg-gradient-to-r from-perdida-500 via-sol-400 to-reencontrada-500"
        aria-hidden="true"
      />
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group shrink-0" aria-label="PetMatch, inicio">
          <Logo />
        </Link>

        <ul
          ref={listaRef}
          onPointerLeave={() => setSombraCursor(null)}
          className="relative hidden items-center gap-1 rounded-full border border-tinta-200/70 bg-white/70 p-1 shadow-sm backdrop-blur xl:flex"
        >
          <span
            aria-hidden="true"
            className="absolute bottom-1 left-0 top-1 rounded-full bg-tinta-100"
            style={{
              width: sombraCursor?.w ?? 0,
              transform: `translateX(${sombraCursor?.x ?? 0}px)`,
              opacity: sombraCursor ? 1 : 0,
              transition: sombraCursor?.desliza
                ? "transform 320ms var(--ease-fuerte), width 320ms var(--ease-fuerte), opacity 150ms ease"
                : "opacity 150ms ease",
            }}
          />
          {pastilla && (
            <span
              aria-hidden="true"
              className="absolute bottom-1 left-0 top-1 rounded-full bg-tinta-900 shadow-[0_6px_16px_-6px_rgba(28,24,41,0.55)]"
              style={{
                width: pastilla.w,
                transform: `translateX(${pastilla.x}px)`,
                transition: deslizar
                  ? "transform 480ms var(--ease-salida), width 480ms var(--ease-salida)"
                  : "none",
              }}
            />
          )}
          {ENLACES.map((enlace) => {
            const esActivo = activo(enlace.href);
            return (
              <li key={enlace.href}>
                <Link
                  href={enlace.href}
                  data-activo={esActivo}
                  onPointerEnter={(evento) => {
                    const nodo = evento.currentTarget;
                    setSombraCursor((previa) => ({
                      x: nodo.offsetLeft,
                      w: nodo.offsetWidth,
                      desliza: previa !== null,
                    }));
                  }}
                  className={`relative block whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition-colors duration-300 ${
                    esActivo
                      ? `text-white ${pastilla ? "" : "bg-tinta-900 shadow-sm"}`
                      : "text-tinta-600 hover:text-tinta-900"
                  }`}
                >
                  {enlace.etiqueta}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <CampanaAlertas />
          {usuario ? (
            <div className="hidden items-center gap-1 rounded-full border border-tinta-200 bg-white/80 p-1 xl:flex">
              <Link
                href={rutaCuenta}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-tinta-700 transition hover:bg-tinta-100"
              >
                {usuario.rol === "VETERINARIA" ? (
                  <Stethoscope className="h-4 w-4 text-encontrada-600" />
                ) : usuario.rol === "REFUGIO" ? (
                  <Home className="h-4 w-4 text-reencontrada-600" />
                ) : (
                  <Radar className="h-4 w-4 text-reencontrada-600" />
                )}
                {usuario.nombre}
              </Link>
              <button
                onClick={cerrarSesionCuenta}
                className="rounded-full p-2 text-tinta-400 transition hover:bg-tinta-100 hover:text-tinta-700"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/cuenta/login"
              className="hidden items-center gap-2 rounded-full border border-tinta-200 bg-white/80 px-4 py-2 text-sm font-semibold text-tinta-700 shadow-sm transition hover:-translate-y-0.5 hover:border-tinta-300 hover:shadow-suave xl:inline-flex"
            >
              <UserCircle2 className="h-4 w-4" />
              Cuenta
            </Link>
          )}
          {admin ? (
            <div className="hidden items-center gap-1 rounded-full border border-reencontrada-200 bg-reencontrada-50 p-1 xl:flex">
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-reencontrada-700 transition hover:bg-white"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-reencontrada-500 text-xs font-bold uppercase text-white">
                  {admin.charAt(0)}
                </span>
                Panel admin
              </Link>
              <button
                onClick={cerrarSesion}
                className="rounded-full p-2 text-reencontrada-600 transition hover:bg-white hover:text-reencontrada-800"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/admin/login"
              className="hidden items-center gap-2 rounded-full border border-tinta-200 bg-white/80 px-4 py-2 text-sm font-semibold text-tinta-700 shadow-sm transition hover:-translate-y-0.5 hover:border-tinta-300 hover:shadow-suave xl:inline-flex"
            >
              <LockKeyhole className="h-4 w-4" />
              Admin
            </Link>
          )}

          <button
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-tinta-200 bg-white/80 text-tinta-700 shadow-sm xl:hidden"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
          >
            {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {menuAbierto && (
        <div className="px-4 pb-5 pt-1 xl:hidden">
          <ul className="space-y-1">
            {ENLACES.map((enlace, indice) => (
              <li
                key={enlace.href}
                className="subir"
                style={
                  {
                    "--retraso": `${indice * 35}ms`,
                    animationDuration: "450ms",
                  } as React.CSSProperties
                }
              >
                <Link
                  href={enlace.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold ${
                    activo(enlace.href)
                      ? "bg-tinta-900 text-white"
                      : "text-tinta-700 hover:bg-white"
                  }`}
                >
                  {enlace.href === "/reportes" ? (
                    <Search className="h-4 w-4" />
                  ) : enlace.href === "/mascotas" ? (
                    <QrCode className="h-4 w-4" />
                  ) : enlace.href === "/donde-acudir" ? (
                    <MapPinned className="h-4 w-4" />
                  ) : enlace.href === "/resguardo" ? (
                    <Home className="h-4 w-4" />
                  ) : enlace.href === "/" ? null : (
                    <Plus className="h-4 w-4" />
                  )}
                  {enlace.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
          <div
            className="subir mt-3 space-y-2 border-t border-tinta-200/70 pt-3"
            style={
              {
                "--retraso": `${ENLACES.length * 35}ms`,
                animationDuration: "450ms",
              } as React.CSSProperties
            }
          >
            {usuario ? (
              <div className="flex gap-2">
                <Link
                  href={rutaCuenta}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-tinta-900 px-4 py-3 font-semibold text-white"
                >
                  {usuario.rol === "VETERINARIA" ? (
                    <Stethoscope className="h-4 w-4" />
                  ) : usuario.rol === "REFUGIO" ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    <Radar className="h-4 w-4" />
                  )}
                  {usuario.nombre}
                </Link>
                <button
                  onClick={cerrarSesionCuenta}
                  className="flex items-center gap-2 rounded-2xl border border-tinta-200 bg-white px-4 py-3 font-semibold text-tinta-700"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </button>
              </div>
            ) : (
              <Link
                href="/cuenta/login"
                className="flex items-center justify-center gap-2 rounded-2xl border border-tinta-200 bg-white px-4 py-3 font-semibold text-tinta-700"
              >
                <UserCircle2 className="h-4 w-4" />
                Iniciar sesión / Crear cuenta
              </Link>
            )}
            {admin ? (
              <div className="flex gap-2">
                <Link
                  href="/admin"
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-reencontrada-500 px-4 py-3 font-semibold text-white"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Panel admin
                </Link>
                <button
                  onClick={cerrarSesion}
                  className="flex items-center gap-2 rounded-2xl border border-tinta-200 bg-white px-4 py-3 font-semibold text-tinta-700"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </button>
              </div>
            ) : (
              <Link
                href="/admin/login"
                className="flex items-center justify-center gap-2 rounded-2xl border border-tinta-200 bg-white px-4 py-3 font-semibold text-tinta-700"
              >
                <LockKeyhole className="h-4 w-4" />
                Acceso administrador
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
