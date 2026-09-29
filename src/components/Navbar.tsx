"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  QrCode,
  Search,
  X,
} from "lucide-react";
import CampanaAlertas from "@/components/CampanaAlertas";
import Logo from "@/components/Logo";

const ENLACES = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/reportes", etiqueta: "Reportes" },
  { href: "/perdida/nuevo", etiqueta: "Perdí mi mascota" },
  { href: "/encontrada/nuevo", etiqueta: "Encontré una" },
  { href: "/mascotas", etiqueta: "Placa QR" },
];

// Navbar global. El botón "Admin" es opcional: nadie necesita iniciar
// sesión para usar la aplicación, solo el administrador para gestionar
// reportes (editar, marcar reencontrada).
export default function Navbar({ admin }: { admin: string | null }) {
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

  function activo(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 print:hidden ${
        conSombra || menuAbierto
          ? "border-tinta-200/70 bg-crema-50/85 shadow-suave backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group shrink-0" aria-label="PetMatch, inicio">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 rounded-full border border-tinta-200/70 bg-white/70 p-1 shadow-sm backdrop-blur lg:flex">
          {ENLACES.map((enlace) => (
            <li key={enlace.href}>
              <Link
                href={enlace.href}
                className={`block whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  activo(enlace.href)
                    ? "bg-tinta-900 text-white shadow-sm"
                    : "text-tinta-600 hover:bg-tinta-100 hover:text-tinta-900"
                }`}
              >
                {enlace.etiqueta}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <CampanaAlertas />
          {admin ? (
            <div className="hidden items-center gap-1 rounded-full border border-reencontrada-200 bg-reencontrada-50 p-1 lg:flex">
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
              className="hidden items-center gap-2 rounded-full border border-tinta-200 bg-white/80 px-4 py-2 text-sm font-semibold text-tinta-700 shadow-sm transition hover:-translate-y-0.5 hover:border-tinta-300 hover:shadow-suave lg:inline-flex"
            >
              <LockKeyhole className="h-4 w-4" />
              Admin
            </Link>
          )}

          <button
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-tinta-200 bg-white/80 text-tinta-700 shadow-sm lg:hidden"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
          >
            {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {menuAbierto && (
        <div className="animate-aparecer px-4 pb-5 pt-1 lg:hidden">
          <ul className="space-y-1">
            {ENLACES.map((enlace) => (
              <li key={enlace.href}>
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
                  ) : enlace.href === "/" ? null : (
                    <Plus className="h-4 w-4" />
                  )}
                  {enlace.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-tinta-200/70 pt-3">
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
