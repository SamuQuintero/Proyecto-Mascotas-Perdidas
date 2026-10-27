import Link from "next/link";
import { notFound } from "next/navigation";
import { HeartHandshake, Mail, MessageCircle, Pencil, Phone, QrCode, Syringe } from "lucide-react";
import { sesionGestion } from "@/lib/cuenta";
import { prisma } from "@/lib/db";
import { puedeGestionar } from "@/lib/propiedad";
import { enlaceTelefono, enlaceWhatsApp } from "@/lib/contacto";
import { resumenSenasFelinas } from "@/lib/felinos";
import { formatearFecha } from "@/lib/formato";
import { ETIQUETA_TAMANO } from "@/lib/tipos";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const mascota = await prisma.mascota.findUnique({
    where: { id: params.id },
    select: { nombre: true },
  });
  return { title: mascota ? `${mascota.nombre} — PetMatch` : "Mascota — PetMatch" };
}

// HU-8: perfil público de la mascota. Es la página que abre el QR de su
// placa, pensada para quien la encontró y la está viendo desde el celular.
export default async function PerfilMascotaPage({ params }: { params: { id: string } }) {
  const mascota = await prisma.mascota.findUnique({
    where: { id: params.id },
    include: { vacunas: { orderBy: { fecha: "desc" } } },
  });
  if (!mascota) notFound();

  const gestiona = puedeGestionar(mascota, await sesionGestion());
  const whatsapp = enlaceWhatsApp(mascota.contactoTelefono);
  const mensaje = encodeURIComponent(
    `¡Hola! Encontré a ${mascota.nombre}. Escaneé el código QR de su placa en PetMatch.`
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {gestiona && (
        <Link href={`/mascotas/${mascota.id}/editar`} className="boton-secundario w-full">
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Editar foto y datos de contacto
        </Link>
      )}

      <div className="relative animate-aparecer overflow-hidden rounded-4xl bg-white shadow-elevada">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mascota.fotoUrl}
          alt={`Fotografía de ${mascota.nombre}`}
          className="aspect-square w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-tinta-900/85 via-tinta-900/40 to-transparent px-6 pb-6 pt-24 text-white">
          <p className="text-sm font-semibold text-white/80">¡Hola! Me llamo</p>
          <h1 className="font-display text-5xl font-extrabold tracking-tight">{mascota.nombre}</h1>
        </div>
      </div>

      <section className="tarjeta space-y-4 p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-encontrada-100 text-encontrada-600">
            <HeartHandshake className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-tinta-900">
              Si me encontraste, avísale a mi familia
            </h2>
            <p className="text-sm text-tinta-500">
              {mascota.contactoNombre} me está buscando. ¡Gracias por ayudarme a volver a casa!
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href={enlaceTelefono(mascota.contactoTelefono)}
            className="boton bg-tinta-900 py-3.5 text-white hover:-translate-y-0.5 hover:bg-tinta-800 focus-visible:ring-tinta-300"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Llamar · {mascota.contactoTelefono}
          </a>
          {whatsapp && (
            <a
              href={`${whatsapp}?text=${mensaje}`}
              target="_blank"
              rel="noopener noreferrer"
              className="boton bg-gradient-to-r from-encontrada-500 to-encontrada-600 py-3.5 text-white shadow-brillo-menta hover:-translate-y-0.5 focus-visible:ring-encontrada-200"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Escribir por WhatsApp
            </a>
          )}
          {mascota.contactoEmail && (
            <a
              href={`mailto:${mascota.contactoEmail}?subject=${encodeURIComponent(`Encontré a ${mascota.nombre}`)}`}
              className="boton-secundario py-3.5 sm:col-span-2"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {mascota.contactoEmail}
            </a>
          )}
        </div>
      </section>

      <section className="tarjeta p-6">
        <h2 className="mb-4 font-display text-lg font-bold">Sobre mí</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Dato etiqueta="Especie" valor={mascota.especie} />
          <Dato etiqueta="Raza" valor={mascota.raza || "—"} />
          <Dato etiqueta="Color" valor={mascota.color} />
          <Dato etiqueta="Tamaño" valor={ETIQUETA_TAMANO[mascota.tamano]} />
          {resumenSenasFelinas(mascota).map(([etiqueta, valor]) => (
            <Dato key={etiqueta} etiqueta={etiqueta} valor={valor} />
          ))}
        </dl>
        {mascota.senasParticulares && (
          <div className="mt-4 rounded-2xl bg-crema-100 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-perdida-700">
              Señas y cuidados
            </p>
            <p className="mt-1 whitespace-pre-line text-tinta-700">{mascota.senasParticulares}</p>
          </div>
        )}
      </section>

      {mascota.vacunas.length > 0 && (
        <section className="tarjeta p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
            <Syringe className="h-5 w-5 text-encontrada-600" aria-hidden="true" />
            Carnet de vacunas
          </h2>
          <ul className="space-y-2">
            {mascota.vacunas.map((vacuna) => (
              <li
                key={vacuna.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-crema-100 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-tinta-800">{vacuna.nombre}</p>
                  <p className="truncate text-xs text-tinta-500">
                    Aplicada por {vacuna.veterinaria}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-tinta-700">
                  {formatearFecha(vacuna.fecha, "larga")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col items-center gap-3 text-center text-sm text-tinta-500">
        <p>¿No puedes contactar a su familia?</p>
        <Link href="/encontrada/nuevo" className="boton-secundario">
          Reportarla como encontrada en PetMatch
        </Link>
        <Link
          href={`/mascotas/${mascota.id}/placa`}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-tinta-400 hover:text-tinta-700"
        >
          <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
          Ver e imprimir la placa
        </Link>
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-tinta-100 bg-tinta-50/60 px-4 py-3">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-tinta-400">{etiqueta}</dt>
      <dd className="mt-0.5 truncate font-semibold text-tinta-800">{valor}</dd>
    </div>
  );
}
