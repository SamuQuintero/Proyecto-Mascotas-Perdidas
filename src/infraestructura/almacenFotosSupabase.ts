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

  // Las claves nuevas (sb_secret_…) no son JWT: van solo en `apikey`. Las
  // antiguas (service_role, un JWT) también se envían como Authorization.
  private cabeceras(extra: Record<string, string> = {}): Record<string, string> {
    const base: Record<string, string> = { apikey: this.claveServicio, ...extra };
    if (!this.claveServicio.startsWith("sb_")) base.Authorization = `Bearer ${this.claveServicio}`;
    return base;
  }

  // Crea el bucket público la primera vez que falta (por ejemplo, si se
  // creó con otro nombre): así la aplicación no depende de un paso manual.
  private async crearBucket(): Promise<void> {
    const r = await fetch(`${this.base}/storage/v1/bucket`, {
      method: "POST",
      headers: this.cabeceras({ "Content-Type": "application/json" }),
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: 5 * 1024 * 1024 }),
    });
    if (!r.ok) console.error("[fotos] No se pudo crear el bucket", r.status, await r.text().catch(() => ""));
  }

  private subir(nombre: string, foto: { contenido: Uint8Array; tipo: string }) {
    return fetch(`${this.base}/storage/v1/object/${BUCKET}/${nombre}`, {
      method: "POST",
      headers: this.cabeceras({
        "Content-Type": foto.tipo,
        "Cache-Control": "public, max-age=31536000, immutable",
      }),
      body: foto.contenido as unknown as BodyInit,
    });
  }

  async guardar(archivo: File): Promise<string> {
    const foto = await prepararFoto(archivo);
    const nombre = `${randomUUID()}.${foto.extension}`;
    let respuesta = await this.subir(nombre, foto);
    if (!respuesta.ok && (respuesta.status === 404 || respuesta.status === 400)) {
      const detalle = await respuesta.clone().text().catch(() => "");
      if (/bucket not found/i.test(detalle)) {
        await this.crearBucket();
        respuesta = await this.subir(nombre, foto);
      }
    }
    if (!respuesta.ok) {
      // El motivo real queda en los logs del servidor (no se envía al navegador).
      console.error("[fotos] Supabase Storage respondió", respuesta.status, await respuesta.text().catch(() => ""));
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
      headers: this.cabeceras(),
    }).catch(() => {});
  }
}
