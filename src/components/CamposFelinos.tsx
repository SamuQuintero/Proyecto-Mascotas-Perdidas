import { Cat } from "lucide-react";
import { Campo } from "@/components/CamposFormulario";
import { COLORES_OJOS, LARGOS_PELAJE, PATRONES_PELAJE } from "@/lib/felinos";

export interface SenasFelinasForm {
  patronPelaje: string;
  largoPelaje: string;
  colorOjos: string;
  esDeInterior: string;
}

export const SENAS_FELINAS_VACIAS: SenasFelinasForm = {
  patronPelaje: "",
  largoPelaje: "",
  colorOjos: "",
  esDeInterior: "",
};

// HU-24: señas propias de los gatos. Quien usa este componente lo muestra
// solo cuando la especie elegida es "Gato".
export default function CamposFelinos({
  valores,
  errores,
  onCambiar,
}: {
  valores: SenasFelinasForm;
  errores: Record<string, string>;
  onCambiar: (campo: keyof SenasFelinasForm, valor: string) => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-reencontrada-200 bg-reencontrada-50/50 p-4">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold text-reencontrada-800">
          <Cat className="h-4 w-4" aria-hidden="true" />
          Señas del gato
        </p>
        <p className="mt-0.5 text-xs text-tinta-500">
          Opcionales, pero ayudan mucho: el color solo describe a miles de gatos. Entre más
          señas, mejor la coincidencia.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Patrón del pelaje" error={errores.patronPelaje}>
          <select
            value={valores.patronPelaje}
            onChange={(e) => onCambiar("patronPelaje", e.target.value)}
            className="campo-input"
          >
            <option value="">No sé / no aplica</option>
            {PATRONES_PELAJE.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Largo del pelaje" error={errores.largoPelaje}>
          <select
            value={valores.largoPelaje}
            onChange={(e) => onCambiar("largoPelaje", e.target.value)}
            className="campo-input"
          >
            <option value="">No sé / no aplica</option>
            {LARGOS_PELAJE.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Color de ojos" error={errores.colorOjos}>
          <select
            value={valores.colorOjos}
            onChange={(e) => onCambiar("colorOjos", e.target.value)}
            className="campo-input"
          >
            <option value="">No sé / no aplica</option>
            {COLORES_OJOS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="¿Es de interior?" error={errores.esDeInterior}>
          <select
            value={valores.esDeInterior}
            onChange={(e) => onCambiar("esDeInterior", e.target.value)}
            className="campo-input"
          >
            <option value="">No sé / no aplica</option>
            <option value="SI">Sí, vive dentro de casa</option>
            <option value="NO">No, sale a la calle</option>
          </select>
        </Campo>
      </div>
    </div>
  );
}
