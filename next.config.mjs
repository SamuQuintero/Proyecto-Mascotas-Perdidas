const produccion = process.env.NODE_ENV === "production";
// HSTS y la mejora a HTTPS solo si el sitio se sirve por HTTPS (Vercel o una
// URL_PUBLICA https): en un `next start` local por http romperían las pruebas.
const sobreHttps =
  produccion && (!!process.env.VERCEL || /^https:\/\//.test(process.env.URL_PUBLICA ?? ""));

// Política de contenido: solo se carga lo propio y los mapas de OpenStreetMap.
// 'unsafe-inline' en scripts lo exige Next.js para sus scripts de arranque;
// 'unsafe-eval' solo se permite en desarrollo (recarga en caliente).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${produccion ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(sobreHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const cabeceras = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  ...(sobreHttps
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No anunciar el framework en cada respuesta.
  poweredByHeader: false,
  // No se usa next/image: se desactiva el endpoint /_next/image (superficie de ataque).
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: cabeceras }];
  },
};

export default nextConfig;
