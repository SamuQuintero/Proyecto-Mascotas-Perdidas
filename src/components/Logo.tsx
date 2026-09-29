import { PawPrint } from "lucide-react";

export default function Logo({ tamano = "md" }: { tamano?: "md" | "lg" }) {
  const caja = tamano === "lg" ? "h-12 w-12 rounded-2xl" : "h-10 w-10 rounded-xl";
  const icono = tamano === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`relative flex ${caja} items-center justify-center bg-gradient-to-br from-perdida-400 via-perdida-500 to-reencontrada-500 text-white shadow-brillo transition duration-300 group-hover:-rotate-12`}
      >
        <PawPrint className={icono} strokeWidth={2.4} aria-hidden="true" />
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-sol-400" />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight text-tinta-900">
        Pet<span className="text-perdida-500">Match</span>
      </span>
    </span>
  );
}
