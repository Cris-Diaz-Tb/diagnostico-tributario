import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` lanza si se importa fuera del servidor de Next.
      // En los tests se sustituye por un módulo vacío para poder probar
      // la lógica pura de los módulos de servidor (ej. lib/meta-capi.ts).
      "server-only": path.resolve(__dirname, "src/test-utils/server-only-vacio.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
