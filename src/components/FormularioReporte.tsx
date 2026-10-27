"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  HeartHandshake,
  Loader2,
  MapPin,
  PawPrint,
  Pencil,
  Phone,
  Search,
  Send,
  TriangleAlert,
} from "lucide-react";
import CampoColor from "@/components/CampoColor";
import CampoImagen from "@/components/CampoImagen";
import { Alerta, Campo, Seccion } from "@/components/CamposFormulario";
import CamposFelinos from "@/components/CamposFelinos";
import { resumenSenasFelinas } from "@/lib/felinos";
import { recordarReporte } from "@/lib/dispositivo";
import {
  fechaParaInput,
  formatearFechaHora,
  horaParaInput,
  instanteColombia,
} from "@/lib/formato";
import {
  ESPECIES,
  FOTO_TIPOS_PERMITIDOS,
  TAMANOS,
  primerErrorPorCampo,
  reporteSchema,
} from "@/lib/validacion";
import { ETIQUETA_TAMANO, type Reporte, type Tamano } from "@/lib/tipos";

const MapaSelector = dynamic(() => import("@/components/MapaSelector"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 animate-pulse items-center justify-center rounded-2xl bg-tinta-100 text-sm text-tinta-400">
      Cargando mapa…
    </div>
  ),
});

const MapaVisor = dynamic(() => import("@/components/MapaVisor"), {
  ssr: false,
});

type Paso = "formulario" | "confirmacion";

interface DuplicadoItem {
  id: string;
  titulo: string;
  color: string;
  zona: string;
  fotoUrl: string;
  razones: string[];
}

interface Props {
  tipo: "PERDIDA" | "ENCONTRADA";
  // Si se recibe, el formulario edita ese reporte (HU-25) en lugar de crear uno.
  reporteInicial?: Reporte;
  // Hay una sesión de cuenta iniciada: el reporte quedará a su nombre.
  conSesion?: boolean;
}

const TEXTOS = {
  PERDIDA: {
    titulo: "Reportar mascota perdida",
    subtitulo:
      "Completa estos datos para que otras personas puedan reconocerla y contactarte. Lo vamos a encontrar.",
    colorAccento: "#FF6B45",
    colorBoton:
      "bg-gradient-to-r from-perdida-500 to-perdida-600 shadow-brillo hover:from-perdida-600 hover:to-perdida-700 focus-visible:ring-perdida-200",
    colorBadge: "bg-perdida-100 text-perdida-700",
    colorIcono: "from-perdida-400 to-perdida-600 shadow-brillo",
    Icono: Search,
  },
  ENCONTRADA: {
    titulo: "Reportar mascota encontrada",
    subtitulo:
      "Gracias por ayudar. Puedes publicar este hallazgo en menos de un minuto, sin crear una cuenta.",
    colorAccento: "#14AD84",
    colorBoton:
      "bg-gradient-to-r from-encontrada-500 to-encontrada-600 shadow-brillo-menta hover:from-encontrada-600 hover:to-encontrada-700 focus-visible:ring-encontrada-200",
    colorBadge: "bg-encontrada-100 text-encontrada-700",
    colorIcono: "from-encontrada-400 to-encontrada-600 shadow-brillo-menta",
    Icono: HeartHandshake,
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
  // HU-24: señas de gato
  patronPelaje: string;
  largoPelaje: string;
  colorOjos: string;
  esDeInterior: string;
  fecha: string;
  hora: string;
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
  patronPelaje: "",
  largoPelaje: "",
  colorOjos: "",
  esDeInterior: "",
  fecha: "",
  hora: "",
  zona: "",
  contactoNombre: "",
  contactoTelefono: "",
  contactoEmail: "",
  reportanteAnonimo: false,
};

function estadoDesdeReporte(reporte: Reporte): EstadoFormulario {
  return {
    especie: reporte.especie,
    raza: reporte.raza ?? "",
    color: reporte.color,
    tamano: reporte.tamano,
    nombre: reporte.nombre ?? "",
    tieneCollar:
      reporte.tieneCollar === true ? "SI" : reporte.tieneCollar === false ? "NO" : "",
    senasParticulares: reporte.senasParticulares ?? "",
    patronPelaje: reporte.patronPelaje ?? "",
    largoPelaje: reporte.largoPelaje ?? "",
    colorOjos: reporte.colorOjos ?? "",
    esDeInterior:
      reporte.esDeInterior === true ? "SI" : reporte.esDeInterior === false ? "NO" : "",
    fecha: fechaParaInput(reporte.fecha),
    hora: horaParaInput(reporte.fecha),
    zona: reporte.zona,
    contactoNombre: reporte.contactoNombre ?? "",
    contactoTelefono: reporte.contactoTelefono ?? "",
    contactoEmail: reporte.contactoEmail ?? "",
    reportanteAnonimo: reporte.reportanteAnonimo,
  };
}

export default function FormularioReporte({ tipo, reporteInicial, conSesion }: Props) {
  const router = useRouter();
  const textos = TEXTOS[tipo];
  const editando = reporteInicial !== undefined;

  const [campos, setCampos] = useState<EstadoFormulario>(() =>
    reporteInicial ? estadoDesdeReporte(reporteInicial) : ESTADO_INICIAL
  );
  const [foto, setFoto] = useState<File | null>(null);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(
    reporteInicial
      ? { lat: reporteInicial.latitud, lng: reporteInicial.longitud }
      : null
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [paso, setPaso] = useState<Paso>("formulario");
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  // HU-15: posibles reportes duplicados del mismo tipo, detectados justo
  // antes de publicar. Es una advertencia, no un bloqueo: la persona decide.
  const [duplicados, setDuplicados] = useState<DuplicadoItem[]>([]);
  const [revisandoDuplicados, setRevisandoDuplicados] = useState(false);

  // Quien encontró una mascota casi siempre la reporta en el momento: se
  // prellenan la fecha y hora actuales (en el cliente, para no desfasar el
  // HTML del servidor). Se pueden cambiar.
  useEffect(() => {
    if (tipo !== "ENCONTRADA" || reporteInicial) return;
    const ahora = new Date();
    setCampos((anterior) =>
      anterior.fecha || anterior.hora
        ? anterior
        : { ...anterior, fecha: fechaParaInput(ahora), hora: horaParaInput(ahora) }
    );
  }, [tipo, reporteInicial]);

  const urlFotoNueva = useMemo(
    () => (foto ? URL.createObjectURL(foto) : null),
    [foto]
  );

  function actualizarCampo<K extends keyof EstadoFormulario>(
    campo: K,
    valor: EstadoFormulario[K]
  ) {
    setCampos((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function construirDatosCrudos() {
    const anonimo = tipo === "ENCONTRADA" && campos.reportanteAnonimo;
    return {
      tipo,
      especie: campos.especie,
      raza: campos.raza,
      color: campos.color,
      tamano: campos.tamano,
      nombre: tipo === "PERDIDA" ? campos.nombre : "",
      tieneCollar: campos.tieneCollar || undefined,
      senasParticulares: campos.senasParticulares,
      patronPelaje: campos.patronPelaje,
      largoPelaje: campos.largoPelaje,
      colorOjos: campos.colorOjos,
      esDeInterior: campos.esDeInterior,
      fecha: campos.fecha,
      hora: campos.hora,
      zona: campos.zona,
      latitud: ubicacion?.lat,
      longitud: ubicacion?.lng,
      // Si el reporte es anónimo no se envía contacto aunque se haya escrito.
      contactoNombre: anonimo ? "" : campos.contactoNombre,
      contactoTelefono: anonimo ? "" : campos.contactoTelefono,
      contactoEmail: anonimo ? "" : campos.contactoEmail,
      reportanteAnonimo: anonimo,
    };
  }

  function validar(): boolean {
    setErrorGeneral(null);

    const resultado = reporteSchema.safeParse(construirDatosCrudos());
    const nuevosErrores: Record<string, string> = resultado.success
      ? {}
      : primerErrorPorCampo(resultado.error);

    if (!foto && !editando) {
      nuevosErrores.foto = "La fotografía es obligatoria.";
    } else if (foto && !FOTO_TIPOS_PERMITIDOS.includes(foto.type)) {
      nuevosErrores.foto = "Formato no soportado. Usa JPG, PNG o WEBP.";
    }

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      setErrorGeneral("Revisa los campos marcados antes de continuar.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }
    return true;
  }

  async function alEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!validar()) return;

    if (editando) {
      guardar();
      return;
    }

    setPaso("confirmacion");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // HU-15: revisar duplicados posibles justo al entrar a la confirmación.
    // No bloquea el paso: si falla o tarda, simplemente no se muestra aviso.
    if (ubicacion) {
      setRevisandoDuplicados(true);
      try {
        const parametros = new URLSearchParams({
          tipo,
          especie: campos.especie,
          color: campos.color,
          fecha: campos.fecha,
          latitud: String(ubicacion.lat),
          longitud: String(ubicacion.lng),
        });
        const respuesta = await fetch(`/api/reportes/duplicados?${parametros}`);
        if (respuesta.ok) setDuplicados((await respuesta.json()).duplicados);
      } catch {
        // silencioso: es solo una advertencia, no algo crítico
      } finally {
        setRevisandoDuplicados(false);
      }
    }
  }

  async function guardar() {
    setEnviando(true);
    setErrorGeneral(null);

    const formData = new FormData();
    Object.entries(construirDatosCrudos()).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null) {
        formData.append(clave, String(valor));
      }
    });
    if (foto) formData.append("foto", foto);

    try {
      const respuesta = await fetch(
        editando ? `/api/reportes/${reporteInicial.id}` : "/api/reportes",
        { method: editando ? "PATCH" : "POST", body: formData }
      );
      const data = await respuesta.json().catch(() => ({}));

      if (respuesta.status === 401) {
        setErrorGeneral(
          "Tu sesión expiró. Inicia sesión de nuevo para guardar los cambios."
        );
        setPaso("formulario");
        return;
      }

      if (!respuesta.ok) {
        setErrores(data.errores ?? {});
        setErrorGeneral(
          data.error ??
            (editando
              ? "No se pudieron guardar los cambios. Revisa los datos."
              : "No se pudo publicar el reporte. Revisa los datos.")
        );
        setPaso("formulario");
        return;
      }

      // Este dispositivo recuerda sus reportes para avisar de coincidencias
      // y hallazgos cercanos en la campana del navbar (HU-4, HU-7).
      if (!editando) recordarReporte(data.reporte.id);
      router.push(
        `/reportes/${data.reporte.id}?${editando ? "editado" : "nuevo"}=true`
      );
      router.refresh();
    } catch {
      setErrorGeneral("No se pudo conectar con el servidor. Intenta nuevamente.");
      setPaso("formulario");
    } finally {
      setEnviando(false);
    }
  }

  const hoy = fechaParaInput(new Date());
  const Icono = editando ? Pencil : textos.Icono;

  if (paso === "confirmacion") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="animate-aparecer">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${textos.colorBadge}`}
          >
            Paso final · Revisa antes de publicar
          </span>
          <h1 className="titulo-display mt-3 text-3xl sm:text-4xl">
            ¿Todo se ve bien?
          </h1>
          <p className="mt-2 text-tinta-500">
            Así verán tu reporte las demás personas.
          </p>
        </div>

        {revisandoDuplicados && (
          <p className="flex items-center gap-2 text-sm text-tinta-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Revisando si ya existe un reporte parecido…
          </p>
        )}

        {duplicados.length > 0 && (
          <div className="animate-aparecer space-y-3 rounded-2xl border border-sol-300 bg-sol-100 p-4">
            <p className="flex items-start gap-2 text-sm font-semibold text-tinta-800">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-sol-500" aria-hidden="true" />
              Encontramos {duplicados.length === 1 ? "un reporte parecido" : "reportes parecidos"} al
              tuyo. Revísalo antes de publicar, por si ya existe:
            </p>
            <ul className="space-y-2">
              {duplicados.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/reportes/${d.id}`}
                    target="_blank"
                    className="flex items-center gap-3 rounded-xl bg-white/70 p-2.5 transition hover:bg-white"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={d.fotoUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-tinta-900">{d.titulo}</p>
                      <p className="truncate text-xs text-tinta-500">
                        {d.zona} · {d.razones.join(" · ")}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-xs text-tinta-600">
              Si es la misma mascota, no hace falta publicar de nuevo. Si no lo es, puedes
              seguir y publicar tu reporte igual.
            </p>
          </div>
        )}

        <div className="tarjeta animate-aparecer space-y-5 overflow-hidden p-0">
          {urlFotoNueva && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urlFotoNueva}
              alt="Fotografía de la mascota"
              className="aspect-[16/10] w-full object-cover"
            />
          )}

          <div className="space-y-5 px-6 pb-6">
            <h2 className="titulo-display text-2xl">
              {(tipo === "PERDIDA" && campos.nombre) || campos.especie}
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Dato etiqueta="Especie" valor={campos.especie} />
              <Dato etiqueta="Raza" valor={campos.raza || "No especificada"} />
              <Dato etiqueta="Color" valor={campos.color} />
              <Dato
                etiqueta="Tamaño"
                valor={campos.tamano ? ETIQUETA_TAMANO[campos.tamano] : ""}
              />
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
              {resumenSenasFelinas({
                especie: campos.especie,
                patronPelaje: campos.patronPelaje,
                largoPelaje: campos.largoPelaje,
                colorOjos: campos.colorOjos,
                esDeInterior:
                  campos.esDeInterior === "SI" ? true : campos.esDeInterior === "NO" ? false : null,
              }).map(([etiqueta, valor]) => (
                <Dato key={etiqueta} etiqueta={etiqueta} valor={valor} />
              ))}
              <Dato
                etiqueta={tipo === "PERDIDA" ? "Se perdió" : "Se encontró"}
                valor={formatearFechaHora(instanteColombia(campos.fecha, campos.hora), "corta")}
                bloque
              />
              <Dato etiqueta="Zona" valor={campos.zona} bloque />
            </dl>

            {campos.senasParticulares && (
              <div className="rounded-2xl bg-crema-100 p-4 text-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-perdida-700">
                  Señas particulares
                </p>
                <p className="mt-1 text-tinta-700">{campos.senasParticulares}</p>
              </div>
            )}

            {ubicacion && (
              <MapaVisor
                lat={ubicacion.lat}
                lng={ubicacion.lng}
                color={textos.colorAccento}
              />
            )}

            <div className="rounded-2xl border border-tinta-100 bg-tinta-50/60 p-4 text-sm">
              {tipo === "ENCONTRADA" && campos.reportanteAnonimo ? (
                <p className="text-tinta-500">Reporte anónimo, sin datos de contacto.</p>
              ) : (
                <dl className="grid gap-3 sm:grid-cols-3">
                  <Dato etiqueta="Contacto" valor={campos.contactoNombre || "—"} plano />
                  <Dato etiqueta="Teléfono" valor={campos.contactoTelefono || "—"} plano />
                  <Dato etiqueta="Correo" valor={campos.contactoEmail || "—"} plano />
                </dl>
              )}
            </div>
          </div>
        </div>

        {errorGeneral && <Alerta>{errorGeneral}</Alerta>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setPaso("formulario")}
            disabled={enviando}
            className="boton-secundario flex-1 py-3.5"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Corregir datos
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={enviando}
            className={`boton flex-1 py-3.5 text-white hover:-translate-y-0.5 ${textos.colorBoton}`}
          >
            {enviando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {enviando ? "Publicando…" : "Publicar reporte"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={alEnviar} className="mx-auto max-w-2xl space-y-6" noValidate>
      {editando && (
        <Link
          href={`/reportes/${reporteInicial.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-tinta-500 transition hover:gap-3 hover:text-tinta-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al reporte
        </Link>
      )}

      <div className="flex animate-aparecer items-start gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${
            editando
              ? "from-reencontrada-400 to-reencontrada-600 shadow-brillo-lavanda"
              : textos.colorIcono
          }`}
        >
          <Icono className="h-7 w-7" aria-hidden="true" />
        </span>
        <div>
          <h1 className="titulo-display text-3xl sm:text-4xl">
            {editando ? "Editar reporte" : textos.titulo}
          </h1>
          <p className="mt-2 text-tinta-500">
            {editando
              ? "Corrige o actualiza la información. Los cambios se verán de inmediato en el reporte publicado."
              : textos.subtitulo}
          </p>
        </div>
      </div>

      {!editando && !conSesion && (
        <p className="rounded-2xl bg-reencontrada-50 p-4 text-sm text-reencontrada-800">
          ¿Quieres poder renovar o editar este reporte más adelante?{" "}
          <Link href="/cuenta/login" className="font-bold underline">
            Inicia sesión
          </Link>{" "}
          o{" "}
          <Link href="/cuenta/registro" className="font-bold underline">
            crea una cuenta
          </Link>{" "}
          antes de publicar. Sin cuenta también puedes publicar.
        </p>
      )}

      {tipo === "ENCONTRADA" && !editando && (
        <p className="rounded-2xl bg-encontrada-50 p-4 text-sm text-encontrada-800">
          ¿No puedes quedarte con el animal? Mira{" "}
          <Link href="/donde-acudir" className="font-bold underline">
            qué veterinarias y refugios cercanos lo reciben
          </Link>
          .
        </p>
      )}

      {errorGeneral && <Alerta>{errorGeneral}</Alerta>}

      <Seccion numero={1} titulo="Datos de la mascota" Icono={PawPrint}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Especie" error={errores.especie} obligatorio>
            <select
              value={campos.especie}
              onChange={(e) => actualizarCampo("especie", e.target.value)}
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

          <Campo etiqueta="Raza (si se conoce)" error={errores.raza}>
            <input
              value={campos.raza}
              onChange={(e) => actualizarCampo("raza", e.target.value)}
              className="campo-input"
              placeholder="Ej. Criollo, Labrador…"
            />
          </Campo>

          <Campo etiqueta="Color" error={errores.color} obligatorio>
            <CampoColor
              valor={campos.color}
              onCambiar={(valor) => actualizarCampo("color", valor)}
              invalido={Boolean(errores.color)}
            />
          </Campo>

          <Campo etiqueta="Tamaño" error={errores.tamano} obligatorio>
            <select
              value={campos.tamano}
              onChange={(e) => actualizarCampo("tamano", e.target.value as Tamano)}
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

        {campos.especie === "Gato" && (
          <CamposFelinos
            valores={campos}
            errores={errores}
            onCambiar={(campo, valor) => actualizarCampo(campo, valor)}
          />
        )}

        <Campo etiqueta="Señas particulares" error={errores.senasParticulares}>
          <textarea
            value={campos.senasParticulares}
            onChange={(e) => actualizarCampo("senasParticulares", e.target.value)}
            className="campo-input min-h-24"
            placeholder="Cicatrices, manchas, comportamiento, a qué nombre responde…"
            maxLength={500}
          />
        </Campo>
      </Seccion>

      <Seccion numero={2} titulo="Fotografía" Icono={Camera}>
        <CampoImagen
          onCambiar={setFoto}
          error={errores.foto}
          urlInicial={reporteInicial?.fotoUrl}
        />
      </Seccion>

      <Seccion numero={3} titulo="Fecha y ubicación" Icono={MapPin}>
        <div className="grid gap-4 sm:grid-cols-[1fr_0.7fr]">
          <Campo
            etiqueta={tipo === "PERDIDA" ? "Fecha en que se perdió" : "Fecha del hallazgo"}
            error={errores.fecha}
            obligatorio
          >
            <input
              type="date"
              max={hoy}
              value={campos.fecha}
              onChange={(e) => actualizarCampo("fecha", e.target.value)}
              className="campo-input"
              aria-invalid={Boolean(errores.fecha)}
            />
          </Campo>

          <Campo etiqueta="Hora aproximada" error={errores.hora} obligatorio>
            <input
              type="time"
              value={campos.hora}
              onChange={(e) => actualizarCampo("hora", e.target.value)}
              className="campo-input"
              aria-invalid={Boolean(errores.hora)}
            />
          </Campo>
        </div>

        <Campo etiqueta="Zona / barrio de referencia" error={errores.zona} obligatorio>
          <input
            value={campos.zona}
            onChange={(e) => actualizarCampo("zona", e.target.value)}
            className="campo-input"
            placeholder="Ej. Barrio Las Cuadras, cerca al parque"
            aria-invalid={Boolean(errores.zona)}
          />
        </Campo>

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-tinta-700">
            Punto exacto en el mapa <span className="text-perdida-500">*</span>
          </span>
          <MapaSelector
            lat={ubicacion?.lat ?? null}
            lng={ubicacion?.lng ?? null}
            color={textos.colorAccento}
            onCambiar={(lat, lng) => setUbicacion({ lat, lng })}
          />
          {(errores.latitud || errores.longitud) && (
            <p className="mt-1.5 text-xs font-medium text-red-600">
              {errores.latitud || errores.longitud}
            </p>
          )}
        </div>
      </Seccion>

      <Seccion numero={4} titulo="Contacto" Icono={Phone}>
        {tipo === "ENCONTRADA" && (
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-tinta-200 bg-crema-50 p-4 text-sm text-tinta-700 transition hover:border-tinta-300">
            <input
              type="checkbox"
              checked={campos.reportanteAnonimo}
              onChange={(e) => actualizarCampo("reportanteAnonimo", e.target.checked)}
              className="h-5 w-5 rounded-md border-tinta-300 accent-encontrada-500"
            />
            <span>
              <span className="block font-semibold">Publicar de forma anónima</span>
              <span className="block text-xs text-tinta-500">
                No se mostrará ningún dato de contacto.
              </span>
            </span>
          </label>
        )}

        {!(tipo === "ENCONTRADA" && campos.reportanteAnonimo) && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo etiqueta="Nombre" error={errores.contactoNombre}>
              <input
                value={campos.contactoNombre}
                onChange={(e) => actualizarCampo("contactoNombre", e.target.value)}
                className="campo-input"
                autoComplete="name"
              />
            </Campo>
            <Campo etiqueta="Teléfono" error={errores.contactoTelefono}>
              <input
                type="tel"
                value={campos.contactoTelefono}
                onChange={(e) => actualizarCampo("contactoTelefono", e.target.value)}
                className="campo-input"
                autoComplete="tel"
                aria-invalid={Boolean(errores.contactoTelefono)}
              />
            </Campo>
            <Campo etiqueta="Correo" error={errores.contactoEmail}>
              <input
                type="email"
                value={campos.contactoEmail}
                onChange={(e) => actualizarCampo("contactoEmail", e.target.value)}
                className="campo-input"
                autoComplete="email"
                aria-invalid={Boolean(errores.contactoEmail)}
              />
            </Campo>
          </div>
        )}
        {tipo === "PERDIDA" && (
          <p className="text-xs text-tinta-500">
            Deja al menos un teléfono o correo para que puedan contactarte.
          </p>
        )}
      </Seccion>

      <button
        type="submit"
        disabled={enviando}
        className={`boton w-full py-4 text-base text-white hover:-translate-y-0.5 ${
          editando
            ? "bg-gradient-to-r from-reencontrada-500 to-reencontrada-600 shadow-brillo-lavanda focus-visible:ring-reencontrada-200"
            : textos.colorBoton
        }`}
      >
        {enviando && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
        {editando
          ? enviando
            ? "Guardando…"
            : "Guardar cambios"
          : "Revisar antes de publicar"}
        {!editando && <ArrowRight className="h-5 w-5" aria-hidden="true" />}
      </button>
    </form>
  );
}

function Dato({
  etiqueta,
  valor,
  bloque,
  plano,
}: {
  etiqueta: string;
  valor: string;
  bloque?: boolean;
  plano?: boolean;
}) {
  return (
    <div
      className={`${bloque ? "col-span-2 sm:col-span-3" : ""} ${
        plano ? "" : "rounded-2xl border border-tinta-100 bg-tinta-50/60 px-4 py-3"
      }`}
    >
      <dt className="text-[11px] font-bold uppercase tracking-wider text-tinta-400">
        {etiqueta}
      </dt>
      <dd className="mt-0.5 truncate font-semibold text-tinta-800">{valor}</dd>
    </div>
  );
}
