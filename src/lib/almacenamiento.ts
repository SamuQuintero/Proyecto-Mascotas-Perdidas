import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
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

export class ErrorArchivoInvalido extends Error {}

export async function guardarFotoReporte(archivo: File): Promise<string> {
  if (!FOTO_TIPOS_PERMITIDOS.includes(archivo.type)) {
    throw new ErrorArchivoInvalido(
      "Formato de imagen no soportado. Usa JPG, PNG o WEBP."
    );
  }

  if (archivo.size > FOTO_TAMANO_MAXIMO_BYTES) {
    throw new ErrorArchivoInvalido("La imagen no puede superar 5 MB.");
  }

  await mkdir(CARPETA_DESTINO, { recursive: true });

  const extension = archivo.type === "image/png" ? "png" : archivo.type === "image/webp" ? "webp" : "jpg";
  const nombreArchivo = `${randomUUID()}.${extension}`;
  const rutaCompleta = path.join(CARPETA_DESTINO, nombreArchivo);

  const buffer = Buffer.from(await archivo.arrayBuffer());
  await writeFile(rutaCompleta, buffer);

  return `/uploads/${nombreArchivo}`;
}
