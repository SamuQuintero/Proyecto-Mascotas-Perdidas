"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera, Loader2, PawPrint, Pencil, Phone, QrCode } from "lucide-react";
import CampoColor from "@/components/CampoColor";
import CampoImagen from "@/components/CampoImagen";
import { Alerta, Campo, Seccion } from "@/components/CamposFormulario";
import CamposFelinos from "@/components/CamposFelinos";
import { recordarMascota } from "@/lib/dispositivo";
import type { Tamano } from "@/lib/tipos";
import {
  ESPECIES,
  FOTO_TIPOS_PERMITIDOS,
  TAMANOS,
  mascotaSchema,
  primerErrorPorCampo,
} from "@/lib/validacion";

const VACIO = {
  nombre: "",
  especie: "",
  raza: "",
  color: "",
  tamano: "" as Tamano | "",
  senasParticulares: "",
  // HU-24: señas de gato
  patronPelaje: "",
  largoPelaje: "",
  colorOjos: "",
  esDeInterior: "",
  contactoNombre: "",
  contactoTelefono: "",
  contactoEmail: "",
};

export interface MascotaEditable {
  id: string;
  nombre: string;
  especie: string;
  raza: string | null;
  color: string;
  tamano: Tamano;
  senasParticulares: string | null;
  patronPelaje: string | null;
  largoPelaje: string | null;
  colorOjos: string | null;
  esDeInterior: boolean | null;
  fotoUrl: string;
  contactoNombre: string;
  contactoTelefono: string;
  contactoEmail: string | null;
}

function camposDesde(mascota: MascotaEditable): typeof VACIO {
  return {
    nombre: mascota.nombre,
    especie: mascota.especie,
    raza: mascota.raza ?? "",
    color: mascota.color,
    tamano: mascota.tamano,
    senasParticulares: mascota.senasParticulares ?? "",
    patronPelaje: mascota.patronPelaje ?? "",
    largoPelaje: mascota.largoPelaje ?? "",
    colorOjos: mascota.colorOjos ?? "",
    esDeInterior: mascota.esDeInterior === true ? "SI" : mascota.esDeInterior === false ? "NO" : "",
    contactoNombre: mascota.contactoNombre,
    contactoTelefono: mascota.contactoTelefono,
    contactoEmail: mascota.contactoEmail ?? "",
  };
}

// HU-8: formulario para crear el perfil digital de una mascota. Con
// `mascotaInicial` edita ese perfil (HU-23): la foto se conserva si no se
// elige otra.
export default function FormularioMascota({ mascotaInicial }: { mascotaInicial?: MascotaEditable }) {
  const router = useRouter();
  const editando = mascotaInicial !== undefined;
  const [campos, setCampos] = useState(mascotaInicial ? camposDesde(mascotaInicial) : VACIO);
  const [foto, setFoto] = useState<File | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizar(campo: keyof typeof VACIO, valor: string) {
    setCampos((anterior) => ({ ...anterior, [campo]: valor }));
  }

  async function crear(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral(null);

    const resultado = mascotaSchema.safeParse(campos);
    const nuevos = resultado.success ? {} : primerErrorPorCampo(resultado.error);
    if (!foto && !editando) nuevos.foto = "La fotografía es obligatoria.";
    else if (foto && !FOTO_TIPOS_PERMITIDOS.includes(foto.type)) {
      nuevos.foto = "Formato no soportado. Usa JPG, PNG o WEBP.";
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      setErrorGeneral("Revisa los campos marcados.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setEnviando(true);
    const formData = new FormData();
    Object.entries(campos).forEach(([clave, valor]) => formData.append(clave, valor));
    if (foto) formData.append("foto", foto);

    try {
      const respuesta = await fetch(
        editando ? `/api/mascotas/${mascotaInicial.id}` : "/api/mascotas",
        { method: editando ? "PATCH" : "POST", body: formData }
      );
      const data = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setErrores(data.errores ?? {});
        setErrorGeneral(
          data.error ??
            (editando
              ? "No se pudieron guardar los cambios. Revisa los datos."
              : "No se pudo crear el perfil. Revisa los datos.")
        );
        setEnviando(false);
        return;
      }
      if (editando) {
        router.push(`/mascotas/${mascotaInicial.id}`);
        router.refresh();
        return;
      }
      recordarMascota(data.mascota.id);
      router.push(`/mascotas/${data.mascota.id}/placa?nuevo=true`);
    } catch {
      setErrorGeneral("No se pudo conectar con el servidor. Intenta nuevamente.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={crear} className="mx-auto max-w-2xl space-y-6" noValidate>
      <div className="flex animate-aparecer items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sol-300 to-perdida-500 text-white shadow-brillo">
          {editando ? (
            <Pencil className="h-7 w-7" aria-hidden="true" />
          ) : (
            <QrCode className="h-7 w-7" aria-hidden="true" />
          )}
        </span>
        <div>
          <h1 className="titulo-display text-3xl sm:text-4xl">
            {editando ? `Editar a ${mascotaInicial.nombre}` : "Crea su placa con QR"}
          </h1>
          <p className="mt-2 text-tinta-500">
            {editando
              ? "Actualiza su foto y tus datos de contacto cuando cambien. El código QR de su placa sigue siendo el mismo: no tienes que volver a imprimirlo."
              : "Completa su perfil una sola vez. Te daremos un código QR para imprimir y ponerlo en su collar: quien la encuentre podrá contactarte al escanearlo."}
          </p>
        </div>
      </div>

      {errorGeneral && <Alerta>{errorGeneral}</Alerta>}

      <Seccion numero={1} titulo="Sobre tu mascota" Icono={PawPrint}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre" error={errores.nombre} obligatorio>
            <input
              value={campos.nombre}
              onChange={(e) => actualizar("nombre", e.target.value)}
              className="campo-input"
              placeholder="Ej. Toby"
              aria-invalid={Boolean(errores.nombre)}
            />
          </Campo>
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
          <Campo etiqueta="Raza" error={errores.raza}>
            <input
              value={campos.raza}
              onChange={(e) => actualizar("raza", e.target.value)}
              className="campo-input"
              placeholder="Ej. Criollo"
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
        </div>
        {campos.especie === "Gato" && (
          <CamposFelinos valores={campos} errores={errores} onCambiar={actualizar} />
        )}
        <Campo etiqueta="Señas particulares o cuidados" error={errores.senasParticulares}>
          <textarea
            value={campos.senasParticulares}
            onChange={(e) => actualizar("senasParticulares", e.target.value)}
            className="campo-input min-h-24"
            placeholder="Manchas, carácter, alergias, medicamentos que necesita…"
            maxLength={500}
          />
        </Campo>
      </Seccion>

      <Seccion numero={2} titulo="Fotografía" Icono={Camera}>
        <CampoImagen onCambiar={setFoto} error={errores.foto} urlInicial={mascotaInicial?.fotoUrl} />
      </Seccion>

      <Seccion numero={3} titulo="Cómo contactarte" Icono={Phone}>
        <p className="text-sm text-tinta-500">
          Estos datos se muestran a quien escanee el QR de la placa.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Tu nombre" error={errores.contactoNombre} obligatorio>
            <input
              value={campos.contactoNombre}
              onChange={(e) => actualizar("contactoNombre", e.target.value)}
              className="campo-input"
              autoComplete="name"
              aria-invalid={Boolean(errores.contactoNombre)}
            />
          </Campo>
          <Campo etiqueta="Teléfono / WhatsApp" error={errores.contactoTelefono} obligatorio>
            <input
              type="tel"
              value={campos.contactoTelefono}
              onChange={(e) => actualizar("contactoTelefono", e.target.value)}
              className="campo-input"
              autoComplete="tel"
              placeholder="300 123 4567"
              aria-invalid={Boolean(errores.contactoTelefono)}
            />
          </Campo>
          <Campo etiqueta="Correo" error={errores.contactoEmail}>
            <input
              type="email"
              value={campos.contactoEmail}
              onChange={(e) => actualizar("contactoEmail", e.target.value)}
              className="campo-input"
              autoComplete="email"
              aria-invalid={Boolean(errores.contactoEmail)}
            />
          </Campo>
        </div>
      </Seccion>

      <button
        type="submit"
        disabled={enviando}
        className="boton w-full bg-gradient-to-r from-perdida-500 to-reencontrada-500 py-4 text-base text-white shadow-brillo hover:-translate-y-0.5 focus-visible:ring-perdida-200"
      >
        {enviando ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : editando ? (
          <Pencil className="h-5 w-5" aria-hidden="true" />
        ) : (
          <QrCode className="h-5 w-5" aria-hidden="true" />
        )}
        {enviando
          ? editando
            ? "Guardando…"
            : "Creando perfil…"
          : editando
            ? "Guardar cambios"
            : "Crear perfil y generar QR"}
      </button>
    </form>
  );
}
