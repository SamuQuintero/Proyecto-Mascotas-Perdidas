"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { haceCuanto } from "@/lib/formato";

interface Mensaje {
  id: string;
  autor: string;
  texto: string;
  creadoEn: string;
}

// HU-11: hilo de mensajes dentro de la plataforma, ligado al reporte en vez
// de a una cuenta. Vive en la propia página pública del reporte: quien
// encontró o perdió la mascota coordina aquí sin exponer teléfono ni
// dirección. El dueño vuelve a esta misma página para leer las respuestas.
export default function MensajesReporte({ reporteId }: { reporteId: string }) {
  const [mensajes, setMensajes] = useState<Mensaje[] | null>(null);
  const [autor, setAutor] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    try {
      const respuesta = await fetch(`/api/reportes/${reporteId}/mensajes`, {
        cache: "no-store",
      });
      if (respuesta.ok) setMensajes((await respuesta.json()).mensajes);
    } catch {
      // silencioso: se reintenta en el próximo polling
    }
  }

  useEffect(() => {
    cargar();
    const intervalo = window.setInterval(cargar, 20000);
    return () => window.clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reporteId]);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/reportes/${reporteId}/mensajes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autor, texto }),
      });
      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => ({}));
        setError(data.error ?? "No se pudo enviar el mensaje.");
        return;
      }
      setTexto("");
      await cargar();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="tarjeta p-5">
      <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold">
        <MessageCircle className="h-5 w-5 text-reencontrada-500" aria-hidden="true" />
        Mensajes
      </h2>
      <p className="mb-4 text-sm text-tinta-500">
        Escribe aquí para coordinar, sin compartir tu teléfono ni tu dirección.
      </p>

      <div className="mb-4 max-h-72 space-y-3 overflow-y-auto">
        {mensajes === null ? (
          <p className="text-sm text-tinta-400">Cargando…</p>
        ) : mensajes.length === 0 ? (
          <p className="rounded-2xl bg-crema-100 p-3 text-sm text-tinta-500">
            Todavía no hay mensajes. Sé el primero en escribir.
          </p>
        ) : (
          mensajes.map((mensaje) => (
            <div key={mensaje.id} className="rounded-2xl bg-crema-100 p-3">
              <div className="mb-0.5 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-tinta-700">{mensaje.autor}</span>
                <span className="text-[11px] text-tinta-400" suppressHydrationWarning>
                  {haceCuanto(mensaje.creadoEn)}
                </span>
              </div>
              <p className="whitespace-pre-line text-sm text-tinta-800">{mensaje.texto}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={enviar} className="space-y-2">
        <input
          value={autor}
          onChange={(e) => setAutor(e.target.value)}
          placeholder="Tu nombre (opcional)"
          maxLength={60}
          className="campo-input"
        />
        <div className="flex gap-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe tu mensaje…"
            maxLength={500}
            rows={2}
            className="campo-input flex-1"
          />
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            className="boton-primario self-end px-4"
            aria-label="Enviar mensaje"
          >
            {enviando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </form>
    </section>
  );
}
