import { PawPrint } from "lucide-react";

export default function Logo({ tamano = "md" }: { tamano?: "md" | "lg" }) {
  const caja = tamano === "lg" ? "h-12 w-12 rounded-2xl" : "h-10 w-10 rounded-xl";
  const icono = tamano === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`relative flex ${caja} items-center justify-center bg-gradient-to-br from-perdida-400 via-perdida-500 to-reencontrada-500 text-white shadow-brillo transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-12 group-hover:scale-110`}
      >
        <PawPrint
          className={`${icono} transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[24deg]`}
          strokeWidth={2.4}
          aria-hidden="true"
        />
        <span className="absolute -right-1 -top-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sol-300 opacity-60 [animation-duration:2.4s]" />
          <span className="relative h-3 w-3 rounded-full border-2 border-white bg-sol-400" />
        </span>
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight text-tinta-900">
        Pet<span className="text-perdida-500">Match</span>
      </span>
    </span>
  );
}
