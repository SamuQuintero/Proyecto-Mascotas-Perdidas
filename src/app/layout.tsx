import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PiePagina from "@/components/PiePagina";
import { adminActual } from "@/lib/admin";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

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
  const admin = adminActual();

  return (
    <html lang="es">
      <body
        className={`${jakarta.variable} ${bricolage.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <Navbar admin={admin} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
          {children}
        </main>
        <PiePagina />
      </body>
    </html>
  );
}
