import type { NextConfig } from "next";

// CSP: 'unsafe-inline' en script-src es necesario para los scripts de
// hidratación de Next.js sin montar infraestructura de nonces; los dominios
// de PostHog cubren la carga diferida de su recorder y la ingesta de
// eventos. Si se agrega un servicio externo nuevo, añadir su dominio aquí.
// En desarrollo React necesita eval() para reconstruir stacks y para el
// refresco en caliente; en producción nunca lo usa, así que el permiso se
// concede solo en dev y la CSP de producción queda igual de estricta.
const esDesarrollo = process.env.NODE_ENV !== "production";
const evalEnDev = esDesarrollo ? " 'unsafe-eval'" : "";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${evalEnDev} https://*.posthog.com https://connect.facebook.net`,
  "style-src 'self' 'unsafe-inline'",
  // facebook.com en img-src: el pixel mide parte de los eventos con
  // peticiones de imagen, no solo con fetch.
  "img-src 'self' data: blob: https://www.facebook.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.posthog.com https://www.facebook.com https://connect.facebook.net",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const headersSeguridad = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: headersSeguridad,
      },
      {
        // El panel interno y los resultados individuales no deben
        // aparecer en buscadores.
        source: "/(admin|resultado)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
