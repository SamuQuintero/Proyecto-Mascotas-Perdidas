import { randomUUID } from "crypto";
import { prepararFoto } from "@/lib/almacenamiento";
import type { AlmacenFotos } from "@/lib/puertos";

// Adaptador del puerto AlmacenFotos para Supabase Storage (bucket público
// "fotos"). Usa la API REST con la clave de servicio, que solo vive en el
// servidor: el navegador nunca la ve. Reutiliza la misma validación que el
// almacén de disco (tipo real por bytes, tamaño, EXIF fuera).

const BUCKET = "fotos";

export class AlmacenFotosSupabase implements AlmacenFotos {
  private base: string;

  constructor(urlProyecto: string, private claveServicio: string) {
    this.base = urlProyecto.replace(/\/$/, "");
  }

  async guardar(archivo: File): Promise<string> {
    const foto = await prepararFoto(archivo);
    const nombre = `${randomUUID()}.${foto.extension}`;
    const respuesta = await fetch(`${this.base}/storage/v1/object/${BUCKET}/${nombre}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.claveServicio}`,
        apikey: this.claveServicio,
        "Content-Type": foto.tipo,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body: foto.contenido as unknown as BodyInit,
    });
    if (!respuesta.ok) {
      throw new Error(`No se pudo guardar la foto (${respuesta.status}).`);
    }
    return `${this.base}/storage/v1/object/public/${BUCKET}/${nombre}`;
  }

  async eliminar(url: string): Promise<void> {
    const prefijo = `${this.base}/storage/v1/object/public/${BUCKET}/`;
    if (!url.startsWith(prefijo)) return; // foto antigua o de otro origen
    const nombre = url.slice(prefijo.length);
    if (!/^[\w-]+\.(jpg|png|webp)$/.test(nombre)) return;
    await fetch(`${this.base}/storage/v1/object/${BUCKET}/${nombre}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.claveServicio}`, apikey: this.claveServicio },
    }).catch(() => {});
  }
}
