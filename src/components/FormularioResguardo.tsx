"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import CampoColor from "@/components/CampoColor";
import CampoImagen from "@/components/CampoImagen";
import { Alerta, Campo } from "@/components/CamposFormulario";
import { fechaParaInput } from "@/lib/formato";
import { animalResguardoSchema } from "@/lib/resguardo";
import { ESPECIES, FOTO_TIPOS_PERMITIDOS, TAMANOS, primerErrorPorCampo } from "@/lib/validacion";

function vacio() {
  return {
    especie: "",
    nombre: "",
    raza: "",
    color: "",
    tamano: "",
    senasParticulares: "",
    desde: fechaParaInput(new Date()),
  };
}

// HU-20: el refugio publica un animal bajo su resguardo y desde cuándo lo tiene.
export default function FormularioResguardo() {
  const router = useRouter();
  const [campos, setCampos] = useState(vacio);
  const [foto, setFoto] = useState<File | null>(null);
  // Cambia la key de CampoImagen para limpiar la vista previa tras publicar.
  const [version, setVersion] = useState(0);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizar(campo: keyof ReturnType<typeof vacio>, valor: string) {
    setCampos((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function publicar(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral(null);

    const resultado = animalResguardoSchema.safeParse(campos);
    const nuevos = resultado.success ? {} : primerErrorPorCampo(resultado.error);
    if (!foto) nuevos.foto = "La fotografía es obligatoria.";
    else if (!FOTO_TIPOS_PERMITIDOS.includes(foto.type)) {
      nuevos.foto = "Formato no soportado. Usa JPG, PNG o WEBP.";
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      setErrorGeneral("Revisa los campos marcados.");
      return;
    }

    setEnviando(true);
    const formData = new FormData();
    Object.entries(campos).forEach(([clave, valor]) => formData.append(clave, valor));
    formData.append("foto", foto as File);

    try {
      const respuesta = await fetch("/api/resguardo", { method: "POST", body: formData });
      const data = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setErrores(data.errores ?? {});
        setErrorGeneral(data.error ?? "No se pudo publicar. Revisa los datos.");
        return;
      }
      setCampos(vacio());
      setFoto(null);
      setVersion((v) => v + 1);
      router.refresh();
    } catch {
      setErrorGeneral("No se pudo conectar con el servidor. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={publicar} className="space-y-4" noValidate>
      {errorGeneral && <Alerta>{errorGeneral}</Alerta>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Especie" error={errores.especie} obligatorio>
          <select
            value={campos.especie}
            onChange={(e) => actualizar("especie", e.target.value)}
            className="campo-input"
            aria-invalid={Boolean(errores.especie)}
          >
            <option value="">Selecciona…</option>
            {ESPECIES.map((especie) => (
              <option key={especie} value={especie}>
                {especie}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Nombre (si tiene)" error={errores.nombre}>
          <input
            value={campos.nombre}
            onChange={(e) => actualizar("nombre", e.target.value)}
            className="campo-input"
            placeholder="Ej. el nombre que le pusieron"
          />
        </Campo>
        <Campo etiqueta="Color" error={errores.color} obligatorio>
          <CampoColor
            valor={campos.color}
            onCambiar={(valor) => actualizar("color", valor)}
            invalido={Boolean(errores.color)}
          />
        </Campo>
        <Campo etiqueta="Tamaño" error={errores.tamano} obligatorio>
          <select
            value={campos.tamano}
            onChange={(e) => actualizar("tamano", e.target.value)}
            className="campo-input"
            aria-invalid={Boolean(errores.tamano)}
          >
            <option value="">Selecciona…</option>
            {TAMANOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.etiqueta}
              </option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Raza" error={errores.raza}>
          <input
            value={campos.raza}
            onChange={(e) => actualizar("raza", e.target.value)}
            className="campo-input"
          />
        </Campo>
        <Campo etiqueta="En resguardo desde" error={errores.desde} obligatorio>
          <input
            type="date"
            value={campos.desde}
            max={fechaParaInput(new Date())}
            onChange={(e) => actualizar("desde", e.target.value)}
            className="campo-input"
            aria-invalid={Boolean(errores.desde)}
          />
        </Campo>
      </div>

      <Campo etiqueta="Señas particulares" error={errores.senasParticulares}>
        <textarea
          value={campos.senasParticulares}
          onChange={(e) => actualizar("senasParticulares", e.target.value)}
          className="campo-input min-h-20"
          placeholder="Cicatrices, manchas, collar, comportamiento…"
          maxLength={500}
        />
      </Campo>

      <CampoImagen key={version} onCambiar={setFoto} error={errores.foto} />

      <button type="submit" disabled={enviando} className="boton-primario w-full py-3">
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Plus className="h-4 w-4" aria-hidden="true" />
        )}
        {enviando ? "Publicando…" : "Publicar animal en resguardo"}
      </button>
    </form>
  );
}
