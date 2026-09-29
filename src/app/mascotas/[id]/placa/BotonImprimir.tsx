"use client";

import { Printer } from "lucide-react";

export default function BotonImprimir() {
  return (
    <button onClick={() => window.print()} className="boton-primario py-3.5">
      <Printer className="h-4 w-4" aria-hidden="true" />
      Imprimir placa
    </button>
  );
}
