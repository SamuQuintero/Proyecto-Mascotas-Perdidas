import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PetMatch — Mascotas perdidas y encontradas",
  description:
    "Registra y encuentra reportes de mascotas perdidas y encontradas con foto y ubicación.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold text-slate-900"
            >
              <span aria-hidden="true">🐾</span>
              PetMatch
            </Link>
            <Link
              href="/reportes"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Ver reportes
            </Link>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-64px)] max-w-5xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
