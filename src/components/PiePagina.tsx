import Link from "next/link";
import { Heart } from "lucide-react";
import GatoAsomado from "@/components/GatoAsomado";
import Logo from "@/components/Logo";
import PausaFueraDeVista from "@/components/movimiento/PausaFueraDeVista";

export default function PiePagina() {
  return (
    <PausaFueraDeVista
      as="footer"
      className="group/pie relative border-t border-tinta-200/70 bg-white/50 backdrop-blur print:hidden"
    >
      {/* El gato queda detrás del borde y se asoma por encima. */}
      <div className="pointer-events-none absolute bottom-full right-6 h-16 w-28 overflow-hidden sm:right-16">
        <GatoAsomado className="absolute bottom-0 left-0 w-28 translate-y-[14px] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/pie:translate-y-0" />
      </div>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-tinta-500 sm:flex-row sm:px-6">
        <Link href="/" className="group" aria-label="PetMatch, inicio">
          <Logo />
        </Link>
        <p className="flex items-center gap-1.5 text-center">
          Hecho con
          <Heart
            className="h-4 w-4 animate-latido fill-perdida-500 text-perdida-500"
            aria-label="amor"
          />
          para que cada mascota vuelva a casa.
        </p>
      </div>
    </PausaFueraDeVista>
  );
}
