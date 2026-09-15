import type { MetadataRoute } from "next";

// El panel interno, las APIs y los resultados individuales (links
// privados por token) no deben aparecer en buscadores.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/resultado/"],
    },
  };
}
