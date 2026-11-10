import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { detectarTipoImagen, limpiarJpeg } from "@/lib/imagen";
import { ErrorFotoInvalida } from "@/lib/puertos";
import {
  FOTO_TAMANO_MAXIMO_BYTES,
  FOTO_TIPOS_PERMITIDOS,
} from "@/lib/validacion";

// Capa de almacenamiento de fotografías. En el Sprint 1 guarda el archivo
// en disco (public/uploads) y devuelve una URL relativa servida por Next.js.
// Queda aislada en esta única función para que, cuando el proyecto crezca,
// cambiar a un proveedor externo (S3, Cloudinary, etc.) no requiera tocar
// las rutas ni los formularios: solo esta implementación.

const CARPETA_DESTINO = path.join(process.cwd(), "public", "uploads");

// Es un ErrorFotoInvalida (ver puertos.ts): así los servicios lo reconocen
// sin depender de este módulo concreto.
export class ErrorArchivoInvalido extends ErrorFotoInvalida {}

export interface FotoPreparada {
  contenido: Uint8Array;
  tipo: string;
  extension: "jpg" | "png" | "webp";
}

// Valida una foto subida y la deja lista para guardar, sea cual sea el
// almacén (disco o la nube): comprueba tipo declarado, tamaño y tipo real por
// los primeros bytes, y quita los metadatos (GPS) de los JPEG.
export async function prepararFoto(archivo: File): Promise<FotoPreparada> {
  if (!FOTO_TIPOS_PERMITIDOS.includes(archivo.type)) {
    throw new ErrorArchivoInvalido("Formato de imagen no soportado. Usa JPG, PNG o WEBP.");
  }
  if (archivo.size > FOTO_TAMANO_MAXIMO_BYTES) {
    throw new ErrorArchivoInvalido("La imagen no puede superar 5 MB.");
  }
  const original = new Uint8Array(await archivo.arrayBuffer());
  const tipoReal = detectarTipoImagen(original);
  if (!tipoReal || tipoReal !== archivo.type) {
    throw new ErrorArchivoInvalido("El archivo no es una imagen válida (JPG, PNG o WEBP).");
  }
  return {
    contenido: tipoReal === "image/jpeg" ? limpiarJpeg(original) : original,
    tipo: tipoReal,
    extension: tipoReal === "image/png" ? "png" : tipoReal === "image/webp" ? "webp" : "jpg",
  };
}

export async function guardarFotoReporte(archivo: File): Promise<string> {
  const foto = await prepararFoto(archivo);
  await mkdir(CARPETA_DESTINO, { recursive: true });
  const nombreArchivo = `${randomUUID()}.${foto.extension}`;
  await writeFile(path.join(CARPETA_DESTINO, nombreArchivo), foto.contenido);
  return `/uploads/${nombreArchivo}`;
}

// Borra una foto reemplazada al editar un reporte (HU-25). Solo acepta
// rutas generadas por guardarFotoReporte (/uploads/<nombre>), así una URL
// manipulada no puede apuntar fuera de la carpeta de fotos. Si el archivo
// ya no existe no es un error: el reporte igual queda con la foto nueva.
export async function eliminarFotoReporte(url: string): Promise<void> {
  const nombre = url.startsWith("/uploads/") ? url.slice("/uploads/".length) : "";
  if (!/^[\w-]+\.(jpg|png|webp)$/.test(nombre)) return;
  await unlink(path.join(CARPETA_DESTINO, nombre)).catch(() => {});
}
