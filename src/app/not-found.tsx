import Link from "next/link";
import { PawPrint } from "lucide-react";

export default function PaginaNoEncontrada() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <span className="flex h-16 w-16 -rotate-12 items-center justify-center rounded-3xl bg-reencontrada-100 text-reencontrada-600">
        <PawPrint className="h-8 w-8" aria-hidden="true" />
      </span>
      <p className="font-display text-6xl font-extrabold texto-degradado">404</p>
      <h1 className="titulo-display text-2xl">Esta página se escapó</h1>
      <p className="text-tinta-500">
        No encontramos lo que buscabas, pero seguro podemos ayudarte a encontrar
        a quien más importa.
      </p>
      <Link href="/" className="boton-primario">
        Volver al inicio
      </Link>
    </div>
  );
}
