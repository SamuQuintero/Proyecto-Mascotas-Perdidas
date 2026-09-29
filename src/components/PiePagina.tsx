import Link from "next/link";
import { Heart } from "lucide-react";
import Logo from "@/components/Logo";

export default function PiePagina() {
  return (
    <footer className="border-t border-tinta-200/70 bg-white/50 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-tinta-500 sm:flex-row sm:px-6">
        <Link href="/" className="group" aria-label="PetMatch, inicio">
          <Logo />
        </Link>
        <p className="flex items-center gap-1.5 text-center">
          Hecho con
          <Heart
            className="h-4 w-4 fill-perdida-500 text-perdida-500"
            aria-label="amor"
          />
          para que cada mascota vuelva a casa.
        </p>
      </div>
    </footer>
  );
}
