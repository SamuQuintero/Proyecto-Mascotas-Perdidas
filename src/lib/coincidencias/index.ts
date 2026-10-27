// Punto de entrada del módulo de coincidencias. Cada archivo de esta carpeta
// tiene una sola responsabilidad (principio de responsabilidad única):
//
//   perfiles.ts     contratos mínimos (ISP)
//   geo.ts          distancias
//   colores.ts      familias de color
//   puntuacion.ts   motor genérico de criterios (OCP)
//   criterios.ts    criterios reutilizables (especie, color, tamaño…)
//   reglas.ts       elegibilidad previa (especie, fecha)
//   reportes.ts     HU-4 / HU-7   reporte ↔ reporte
//   duplicados.ts   HU-15         reporte ↔ reporte del mismo tipo
//   mascotas.ts     HU-10         perfil con QR ↔ hallazgo
//   resguardo.ts    HU-20         animal en resguardo ↔ pérdida
//
// El resto de la aplicación importa de "@/lib/coincidencias" y no necesita
// saber cómo está dividido.

export * from "./colores";
export * from "./duplicados";
export * from "./geo";
export * from "./mascotas";
export * from "./perfiles";
export * from "./puntuacion";
export * from "./criterios";
export * from "./reportes";
export * from "./resguardo";
