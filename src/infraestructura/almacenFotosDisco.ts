import { eliminarFotoReporte, guardarFotoReporte } from "@/lib/almacenamiento";
import type { AlmacenFotos } from "@/lib/puertos";

// Adaptador del puerto AlmacenFotos: guarda las fotos en public/uploads.
// Para pasar a un servicio en la nube (S3, Cloudinary, Storage de Supabase)
// se escribe otra clase que implemente AlmacenFotos y se cambia una línea en
// src/composicion.ts; los servicios y las rutas no se tocan.
export class AlmacenFotosDisco implements AlmacenFotos {
  guardar(archivo: File): Promise<string> {
    return guardarFotoReporte(archivo);
  }

  eliminar(url: string): Promise<void> {
    return eliminarFotoReporte(url);
  }
}
