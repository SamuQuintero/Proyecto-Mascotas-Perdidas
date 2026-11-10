// Validación y limpieza de las fotos subidas. El tipo declarado por el
// navegador (File.type) lo controla quien sube el archivo, así que no sirve
// como garantía: se identifica la imagen por sus primeros bytes. Además se
// eliminan los metadatos EXIF de los JPEG (la ubicación GPS de la foto puede
// revelar el domicilio de quien la tomó), conservando solo la orientación.

export type TipoImagen = "image/jpeg" | "image/png" | "image/webp";

export function detectarTipoImagen(b: Uint8Array): TipoImagen | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    b.length >= 12 &&
    String.fromCharCode(b[0], b[1], b[2], b[3]) === "RIFF" &&
    String.fromCharCode(b[8], b[9], b[10], b[11]) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

// Orientación EXIF (1–8) dentro de un segmento APP1, o null.
function leerOrientacion(datos: Uint8Array): number | null {
  // "Exif\0\0" + cabecera TIFF
  if (datos.length < 14 || String.fromCharCode(...datos.slice(0, 4)) !== "Exif") return null;
  const t = 6;
  const little = datos[t] === 0x49;
  const u16 = (o: number) =>
    little ? datos[o] | (datos[o + 1] << 8) : (datos[o] << 8) | datos[o + 1];
  const u32 = (o: number) =>
    little
      ? (datos[o] | (datos[o + 1] << 8) | (datos[o + 2] << 16) | (datos[o + 3] << 24)) >>> 0
      : ((datos[o] << 24) | (datos[o + 1] << 16) | (datos[o + 2] << 8) | datos[o + 3]) >>> 0;
  if (u16(t + 2) !== 42) return null;
  const ifd = t + u32(t + 4);
  if (ifd + 2 > datos.length) return null;
  const entradas = u16(ifd);
  for (let i = 0; i < entradas; i++) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > datos.length) return null;
    if (u16(e) === 0x0112) {
      const valor = u16(e + 8);
      return valor >= 1 && valor <= 8 ? valor : null;
    }
  }
  return null;
}

// APP1 mínimo con solo la orientación (TIFF little-endian, una entrada).
function segmentoOrientacion(orientacion: number): Uint8Array {
  const cuerpo = [
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, // II, 42, IFD0 en 8
    0x01, 0x00, // 1 entrada
    0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, orientacion, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, // sin siguiente IFD
  ];
  const largo = cuerpo.length + 2;
  return Uint8Array.from([0xff, 0xe1, largo >> 8, largo & 0xff, ...cuerpo]);
}

/** Quita EXIF/XMP/comentarios de un JPEG; conserva imagen y orientación. */
export function limpiarJpeg(b: Uint8Array): Uint8Array {
  const partes: Uint8Array[] = [b.slice(0, 2)]; // SOI
  let orientacion: number | null = null;
  let i = 2;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) break;
    const marcador = b[i + 1];
    if (marcador === 0xff) { i += 1; continue; }
    // Inicio del scan: el resto es imagen comprimida, se copia tal cual.
    if (marcador === 0xda) break;
    const largo = (b[i + 2] << 8) | b[i + 3];
    if (largo < 2 || i + 2 + largo > b.length) return b; // estructura rara: no se toca
    const segmento = b.slice(i, i + 2 + largo);
    if (marcador === 0xe1) {
      orientacion = orientacion ?? leerOrientacion(b.slice(i + 4, i + 2 + largo));
    } else if (marcador !== 0xfe && !(marcador >= 0xe2 && marcador <= 0xef)) {
      // Se conservan las tablas y el marco (DQT, SOF, DHT, DRI, APP0…).
      partes.push(segmento);
    }
    i += 2 + largo;
  }
  if (orientacion && orientacion !== 1) partes.splice(1, 0, segmentoOrientacion(orientacion));
  partes.push(b.slice(i));
  const total = partes.reduce((s, p) => s + p.length, 0);
  const salida = new Uint8Array(total);
  let o = 0;
  for (const p of partes) { salida.set(p, o); o += p.length; }
  return salida;
}
