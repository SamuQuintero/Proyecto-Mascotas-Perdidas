import type { NextRequest } from "next/server";

// Lee un multipart/form-data con una foto opcional: devuelve los campos de
// texto y el archivo `foto` por separado, o null si el cuerpo no es un
// formulario. Es detalle de HTTP, por eso vive fuera de los servicios.
export async function leerFormulario(
  request: NextRequest
): Promise<{ datos: Record<string, FormDataEntryValue>; foto: File | null } | null> {
  const formData = await request.formData().catch(() => null);
  if (!formData) return null;

  const foto = formData.get("foto");
  const datos = Object.fromEntries(
    Array.from(formData.entries()).filter(([clave]) => clave !== "foto")
  );
  return { datos, foto: foto instanceof File ? foto : null };
}
