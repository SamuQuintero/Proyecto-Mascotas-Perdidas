"use client";

import { useEffect, useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import {
  enlaceCompartirFacebook,
  enlaceCompartirWhatsApp,
  enlaceCompartirX,
} from "@/lib/compartir";

// HU-21: compartir el reporte en redes con un enlace a la plataforma.
export default function BotonesCompartir({
  url,
  texto,
  enlaceLocal,
}: {
  url: string;
  texto: string;
  // El enlace apunta a localhost: sirve para probar, pero otros no podrán abrirlo.
  enlaceLocal: boolean;
}) {
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState(false);
  // Se decide tras montar: en el servidor no hay navigator (evita desajuste de hidratación).
  const [puedeNativo, setPuedeNativo] = useState(false);
  useEffect(() => setPuedeNativo("share" in navigator), []);

  async function copiar() {
    setError(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      setError(true);
    }
  }

  async function compartirNativo() {
    try {
      await navigator.share({ title: "PetMatch", text: texto, url });
    } catch {
      // La persona canceló el diálogo: no es un error.
    }
  }

  const clase =
    "inline-flex items-center gap-2 rounded-full border border-tinta-200 bg-white px-3.5 py-2 text-sm font-semibold text-tinta-700 transition hover:border-tinta-300 hover:bg-tinta-50";

  return (
    <section className="tarjeta p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Share2 className="h-5 w-5 text-reencontrada-500" aria-hidden="true" />
        Compartir
      </h2>
      <p className="mt-1 text-sm text-tinta-500">
        Más personas viendo el reporte, más posibilidades. El enlace lleva a esta página, con la
        información siempre actualizada.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={enlaceCompartirWhatsApp(url, texto)}
          target="_blank"
          rel="noopener noreferrer"
          className={clase}
        >
          <MessageCircle className="h-4 w-4 text-encontrada-600" aria-hidden="true" />
          WhatsApp
        </a>
        <a
          href={enlaceCompartirFacebook(url)}
          target="_blank"
          rel="noopener noreferrer"
          className={clase}
        >
          Facebook
        </a>
        <a
          href={enlaceCompartirX(url, texto)}
          target="_blank"
          rel="noopener noreferrer"
          className={clase}
        >
          X
        </a>
        <button type="button" onClick={copiar} className={clase}>
          {copiado ? (
            <Check className="h-4 w-4 text-encontrada-600" aria-hidden="true" />
          ) : (
            <Link2 className="h-4 w-4" aria-hidden="true" />
          )}
          {copiado ? "¡Enlace copiado!" : "Copiar enlace"}
        </button>
        {puedeNativo && (
          <button type="button" onClick={compartirNativo} className={clase}>
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Más…
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">
          No se pudo copiar. Selecciona y copia el enlace desde la barra del navegador.
        </p>
      )}
      {enlaceLocal && (
        <p className="mt-3 rounded-xl bg-sol-100 p-3 text-xs text-tinta-600">
          Este enlace apunta a tu computador (localhost): solo funciona aquí. Cuando la
          plataforma esté publicada en internet, define <code>URL_PUBLICA</code> para que el
          enlace funcione para todos.
        </p>
      )}
    </section>
  );
}
