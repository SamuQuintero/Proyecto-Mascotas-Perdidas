"use client";

import { FlaskConical } from "lucide-react";
import type { CuentaPrueba } from "@/lib/cuentasPrueba";

// Modo pruebas de usabilidad: botones que rellenan el formulario con una
// cuenta de ejemplo. Solo se muestra si .env define MOSTRAR_CUENTAS_PRUEBA=true.
export default function CuentasPrueba({
  cuentas,
  alElegir,
}: {
  cuentas: CuentaPrueba[];
  alElegir: (cuenta: CuentaPrueba) => void;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-sol-400 bg-sol-100/60 p-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-tinta-700">
        <FlaskConical className="h-3.5 w-3.5 text-sol-500" aria-hidden="true" />
        Modo pruebas · rellenar con una cuenta de ejemplo
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {cuentas.map((cuenta) => (
          <button
            key={cuenta.usuario}
            type="button"
            onClick={() => alElegir(cuenta)}
            className="rounded-full border border-sol-300 bg-white px-3.5 py-1.5 text-xs font-bold text-tinta-700 shadow-sm transition hover:-translate-y-0.5 hover:border-sol-400 hover:shadow-suave active:scale-95"
          >
            {cuenta.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}
