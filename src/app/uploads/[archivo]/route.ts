import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

// En producción (`next start`), Next.js solo sirve los archivos que ya
// estaban en /public al compilar: las fotos subidas después responderían
// 404. Esta ruta las sirve desde disco. Los archivos que sí existían al
// compilar (y todos en `next dev`) los sigue sirviendo Next.js directamente.

const TIPOS: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: { archivo: string } }
) {
  // Solo nombres generados por guardarFotoReporte: evita leer fuera de la carpeta.
  const coincidencia = /^[\w-]+\.(jpg|png|webp)$/.exec(params.archivo);
  if (!coincidencia) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  try {
    const contenido = await readFile(
      path.join(process.cwd(), "public", "uploads", params.archivo)
    );
    return new NextResponse(contenido, {
      headers: {
        "Content-Type": TIPOS[coincidencia[1]],
        // El nombre es un UUID único: el archivo nunca cambia.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("No encontrado", { status: 404 });
  }
}
