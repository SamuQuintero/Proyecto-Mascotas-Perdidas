"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CampoImagen from "@/components/CampoImagen";
import {
  ESPECIES,
  FOTO_TIPOS_PERMITIDOS,
  TAMANOS,
  primerErrorPorCampo,
  reporteSchema,
} from "@/lib/validacion";
import { ETIQUETA_TAMANO, type Tamano } from "@/lib/tipos";

const MapaSelector = dynamic(() => import("@/components/MapaSelector"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-400">
      Cargando mapa…
    </div>
  ),
});

const MapaVisor = dynamic(() => import("@/components/MapaVisor"), {
  ssr: false,
});

type Paso = "formulario" | "confirmacion";

interface Props {
  tipo: "PERDIDA" | "ENCONTRADA";
}

const TEXTOS = {
  PERDIDA: {
    titulo: "Reportar mascota perdida",
    subtitulo:
      "Completa estos datos para que otras personas puedan reconocerla y contactarte.",
    colorAccento: "#f97316",
    colorBoton: "bg-perdida-600 hover:bg-perdida-700",
    colorBadge: "bg-perdida-100 text-perdida-700",
  },
  ENCONTRADA: {
    titulo: "Reportar mascota encontrada",
    subtitulo:
      "Puedes publicar este hallazgo en menos de un minuto, sin crear una cuenta.",
    colorAccento: "#10b981",
    colorBoton: "bg-encontrada-600 hover:bg-encontrada-700",
    colorBadge: "bg-encontrada-100 text-encontrada-700",
  },
} as const;

interface EstadoFormulario {
  especie: string;
  raza: string;
  color: string;
  tamano: Tamano | "";
  nombre: string;
  tieneCollar: "SI" | "NO" | "NO_SE" | "";
  senasParticulares: string;
  fecha: string;
  zona: string;
  contactoNombre: string;
  contactoTelefono: string;
  contactoEmail: string;
  reportanteAnonimo: boolean;
}

const ESTADO_INICIAL: EstadoFormulario = {
  especie: "",
  raza: "",
  color: "",
  tamano: "",
  nombre: "",
  tieneCollar: "",
  senasParticulares: "",
  fecha: "",
  zona: "",
  contactoNombre: "",
  contactoTelefono: "",
  contactoEmail: "",
  reportanteAnonimo: false,
};

export default function FormularioReporte({ tipo }: Props) {
  const router = useRouter();
  const textos = TEXTOS[tipo];

  const [campos, setCampos] = useState<EstadoFormulario>(ESTADO_INICIAL);
  const [foto, setFoto] = useState<File | null>(null);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [paso, setPaso] = useState<Paso>("formulario");
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  function actualizarCampo<K extends keyof EstadoFormulario>(
    campo: K,
    valor: EstadoFormulario[K]
  ) {
    setCampos((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function construirDatosCrudos() {
    return {
      tipo,
      especie: campos.especie,
      raza: campos.raza,
      color: campos.color,
      tamano: campos.tamano,
      nombre: campos.nombre,
      tieneCollar: campos.tieneCollar || undefined,
      senasParticulares: campos.senasParticulares,
      fecha: campos.fecha,
      zona: campos.zona,
      latitud: ubicacion?.lat,
      longitud: ubicacion?.lng,
      contactoNombre: campos.contactoNombre,
      contactoTelefono: campos.contactoTelefono,
      contactoEmail: campos.contactoEmail,
      reportanteAnonimo: campos.reportanteAnonimo,
    };
  }

  function validarYContinuar(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral(null);

    const resultado = reporteSchema.safeParse(construirDatosCrudos());
    const nuevosErrores: Record<string, string> = resultado.success
      ? {}
      : primerErrorPorCampo(resultado.error);

    if (!foto) {
      nuevosErrores.foto = "La fotografía es obligatoria.";
    } else if (!FOTO_TIPOS_PERMITIDOS.includes(foto.type)) {
      nuevosErrores.foto = "Formato no soportado. Usa JPG, PNG o WEBP.";
    }

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      setErrorGeneral("Revisa los campos marcados antes de continuar.");
      return;
    }

    setPaso("confirmacion");
  }

  async function publicarReporte() {
    if (!foto) return;
    setEnviando(true);
    setErrorGeneral(null);

    const formData = new FormData();
    const datos = construirDatosCrudos();
    Object.entries(datos).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null) {
        formData.append(clave, String(valor));
      }
    });
    formData.append("foto", foto);

    try {
      const respuesta = await fetch("/api/reportes", {
        method: "POST",
        body: formData,
      });
      const data = await respuesta.json();

      if (!respuesta.ok) {
        setErrores(data.errores ?? {});
        setErrorGeneral("No se pudo publicar el reporte. Revisa los datos.");
        setPaso("formulario");
        return;
      }

      router.push(`/reportes/${data.reporte.id}?nuevo=true`);
    } catch {
      setErrorGeneral(
        "No se pudo conectar con el servidor. Intenta nuevamente."
      );
      setPaso("formulario");
    } finally {
      setEnviando(false);
    }
  }

  const hoy = new Date().toISOString().slice(0, 10);

  if (paso === "confirmacion") {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${textos.colorBadge}`}
          >
            Revisa antes de publicar
          </span>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {textos.titulo}
          </h1>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          {foto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={URL.createObjectURL(foto)}
              alt="Fotografía de la mascota"
              className="h-48 w-full rounded-xl object-cover"
            />
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Dato etiqueta="Especie" valor={campos.especie} />
            <Dato etiqueta="Raza" valor={campos.raza || "No especificada"} />
            <Dato etiqueta="Color" valor={campos.color} />
            <Dato
              etiqueta="Tamaño"
              valor={campos.tamano ? ETIQUETA_TAMANO[campos.tamano] : ""}
            />
            {tipo === "PERDIDA" && (
              <Dato etiqueta="Nombre" valor={campos.nombre || "No indicado"} />
            )}
            <Dato
              etiqueta="Collar"
              valor={
                campos.tieneCollar === "SI"
                  ? "Sí"
                  : campos.tieneCollar === "NO"
                    ? "No"
                    : "No sabe"
              }
            />
            <Dato etiqueta="Fecha" valor={campos.fecha} />
            <Dato etiqueta="Zona" valor={campos.zona} />
          </dl>

          {campos.senasParticulares && (
            <Dato
              etiqueta="Señas particulares"
              valor={campos.senasParticulares}
              bloque
            />
          )}

          {ubicacion && (
            <MapaVisor
              lat={ubicacion.lat}
              lng={ubicacion.lng}
              color={textos.colorAccento}
            />
          )}

          <div className="border-t border-slate-100 pt-3 text-sm">
            {campos.reportanteAnonimo ? (
              <p className="text-slate-500">Reporte anónimo, sin datos de contacto.</p>
            ) : (
              <>
                <Dato etiqueta="Contacto" valor={campos.contactoNombre || "—"} />
                <Dato etiqueta="Teléfono" valor={campos.contactoTelefono || "—"} />
                <Dato etiqueta="Correo" valor={campos.contactoEmail || "—"} />
              </>
            )}
          </div>
        </div>

        {errorGeneral && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {errorGeneral}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPaso("formulario")}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={publicarReporte}
            disabled={enviando}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 ${textos.colorBoton}`}
          >
            {enviando ? "Publicando…" : "Publicar reporte"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={validarYContinuar} className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{textos.titulo}</h1>
        <p className="mt-1 text-sm text-slate-600">{textos.subtitulo}</p>
      </div>

      {errorGeneral && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {errorGeneral}
        </p>
      )}

      <Seccion titulo="Datos de la mascota">
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Especie" error={errores.especie} obligatorio>
            <select
              value={campos.especie}
              onChange={(e) => actualizarCampo("especie", e.target.value)}
              className="campo-input"
            >
              <option value="">Selecciona…</option>
              {ESPECIES.map((especie) => (
                <option key={especie} value={especie}>
                  {especie}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Raza (si se conoce)" error={errores.raza}>
            <input
              value={campos.raza}
              onChange={(e) => actualizarCampo("raza", e.target.value)}
              className="campo-input"
              placeholder="Ej. Criollo, Labrador…"
            />
          </Campo>

          <Campo etiqueta="Color" error={errores.color} obligatorio>
            <input
              value={campos.color}
              onChange={(e) => actualizarCampo("color", e.target.value)}
              className="campo-input"
              placeholder="Ej. Café con blanco"
            />
          </Campo>

          <Campo etiqueta="Tamaño" error={errores.tamano} obligatorio>
            <select
              value={campos.tamano}
              onChange={(e) =>
                actualizarCampo("tamano", e.target.value as Tamano)
              }
              className="campo-input"
            >
              <option value="">Selecciona…</option>
              {TAMANOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </select>
          </Campo>

          {tipo === "PERDIDA" && (
            <Campo etiqueta="Nombre de la mascota" error={errores.nombre}>
              <input
                value={campos.nombre}
                onChange={(e) => actualizarCampo("nombre", e.target.value)}
                className="campo-input"
                placeholder="Ej. Toby"
              />
            </Campo>
          )}

          <Campo etiqueta="¿Tiene collar?" error={errores.tieneCollar}>
            <select
              value={campos.tieneCollar}
              onChange={(e) =>
                actualizarCampo("tieneCollar", e.target.value as "SI" | "NO" | "NO_SE")
              }
              className="campo-input"
            >
              <option value="">No sabe / no aplica</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </Campo>
        </div>

        <Campo
          etiqueta="Señas particulares"
          error={errores.senasParticulares}
        >
          <textarea
            value={campos.senasParticulares}
            onChange={(e) =>
              actualizarCampo("senasParticulares", e.target.value)
            }
            className="campo-input min-h-20"
            placeholder="Cicatrices, manchas, comportamiento, etc."
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Fotografía">
        <CampoImagen onCambiar={setFoto} error={errores.foto} />
      </Seccion>

      <Seccion titulo="Fecha y ubicación">
        <Campo
          etiqueta={
            tipo === "PERDIDA" ? "Fecha en que se perdió" : "Fecha del hallazgo"
          }
          error={errores.fecha}
          obligatorio
        >
          <input
            type="date"
            max={hoy}
            value={campos.fecha}
            onChange={(e) => actualizarCampo("fecha", e.target.value)}
            className="campo-input"
          />
        </Campo>

        <Campo
          etiqueta="Zona / barrio de referencia"
          error={errores.zona}
          obligatorio
        >
          <input
            value={campos.zona}
            onChange={(e) => actualizarCampo("zona", e.target.value)}
            className="campo-input"
            placeholder="Ej. Barrio Santa Bárbara, cerca al parque"
          />
        </Campo>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Punto exacto en el mapa <span className="text-red-500">*</span>
          </label>
          <MapaSelector
            lat={ubicacion?.lat ?? null}
            lng={ubicacion?.lng ?? null}
            color={textos.colorAccento}
            onCambiar={(lat, lng) => setUbicacion({ lat, lng })}
          />
          {(errores.latitud || errores.longitud) && (
            <p className="mt-1 text-xs text-red-600">
              {errores.latitud || errores.longitud}
            </p>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Contacto">
        {tipo === "ENCONTRADA" && (
          <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={campos.reportanteAnonimo}
              onChange={(e) =>
                actualizarCampo("reportanteAnonimo", e.target.checked)
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            Prefiero no dejar mis datos de contacto (reporte anónimo)
          </label>
        )}

        {!campos.reportanteAnonimo && (
          <div className="grid grid-cols-2 gap-4">
            <Campo etiqueta="Nombre" error={errores.contactoNombre}>
              <input
                value={campos.contactoNombre}
                onChange={(e) =>
                  actualizarCampo("contactoNombre", e.target.value)
                }
                className="campo-input"
              />
            </Campo>
            <Campo etiqueta="Teléfono" error={errores.contactoTelefono}>
              <input
                value={campos.contactoTelefono}
                onChange={(e) =>
                  actualizarCampo("contactoTelefono", e.target.value)
                }
                className="campo-input"
              />
            </Campo>
            <Campo etiqueta="Correo" error={errores.contactoEmail}>
              <input
                type="email"
                value={campos.contactoEmail}
                onChange={(e) =>
                  actualizarCampo("contactoEmail", e.target.value)
                }
                className="campo-input"
              />
            </Campo>
          </div>
        )}
        {tipo === "PERDIDA" && (
          <p className="mt-1 text-xs text-slate-500">
            Deja al menos un teléfono o correo para que puedan contactarte.
          </p>
        )}
      </Seccion>

      <button
        type="submit"
        className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white ${textos.colorBoton}`}
      >
        Revisar antes de publicar
      </button>
    </form>
  );
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <legend className="px-1 text-sm font-semibold text-slate-500">
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

function Campo({
  etiqueta,
  error,
  obligatorio,
  children,
}: {
  etiqueta: string;
  error?: string;
  obligatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {etiqueta} {obligatorio && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function Dato({
  etiqueta,
  valor,
  bloque,
}: {
  etiqueta: string;
  valor: string;
  bloque?: boolean;
}) {
  return (
    <div className={bloque ? "col-span-2" : undefined}>
      <dt className="text-xs uppercase tracking-wide text-slate-400">
        {etiqueta}
      </dt>
      <dd className="text-slate-800">{valor}</dd>
    </div>
  );
}
