// Datos de prueba para QA del panel /admin: npm run seed
// Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

function cargarEnv() {
  try {
    const contenido = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const linea of contenido.split("\n")) {
      const match = linea.match(/^([A-Z_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
    }
  } catch {
    // sin .env.local: usar variables del entorno
  }
}

cargarEnv();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

// Rangos por fase: rutas A y B 7-21, ruta C 8-24.
const FASES = {
  A: [["A1", 7, 11], ["A2", 12, 16], ["A3", 17, 21]],
  B: [["B1", 7, 11], ["B2", 12, 16], ["B3", 17, 21]],
  C: [["C1", 8, 13], ["C2", 14, 19], ["C3", 20, 24]],
};
const TOTAL_PREGUNTAS = { A: 10, B: 10, C: 11 };
const OFERTA_POR_RUTA = { A: "asesoria_patrimonial", B: "asesoria_patrimonial", C: "patrimonial_internacional" };
const PROBLEMAS = ["pago_de_mas", "notificacion_sii", "comprar_mas", "sociedad", "herencia"];
const INTENCIONES = ["nada", "contenido_gratis", "compro_producto", "contrato_servicio"];
const NOMBRES = ["Carolina", "Rodrigo", "Francisca", "Cristián", "Macarena", "Felipe", "Javiera", "Gonzalo"];
const FUENTES = ["instagram", "facebook", null];

const azar = (arr) => arr[Math.floor(Math.random() * arr.length)];
const entre = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

const filas = [];
for (let i = 0; i < 28; i++) {
  const dado = Math.random();
  const ruta = dado < 0.6 ? "A" : dado < 0.9 ? "B" : "C";
  const [fase, min, max] = azar(FASES[ruta]);
  const conEmail = Math.random() < 0.7;
  const nombre = azar(NOMBRES);
  const fecha = new Date(Date.now() - entre(0, 14) * 86400000).toISOString();
  const problema = azar(PROBLEMAS);

  filas.push({
    token_resultado: `seed-${randomUUID()}`,
    estado: conEmail ? "capturado" : "completado",
    nombre: conEmail ? nombre : null,
    email: conEmail ? `${nombre.toLowerCase()}${i}@ejemplo.cl` : null,
    email_capturado_at: conEmail ? fecha : null,
    consentimiento: conEmail,
    consentimiento_at: conEmail ? fecha : null,
    fecha_creacion: fecha,
    iniciado_at: fecha,
    completado_at: fecha,
    ultima_actividad_at: fecha,
    ruta,
    fase,
    score_numerico: entre(min, max),
    respuestas: [{ seed: true, nota: "registro de prueba" }],
    preguntas_respondidas: TOTAL_PREGUNTAS[ruta],
    total_preguntas: TOTAL_PREGUNTAS[ruta],
    problema_principal: problema,
    nivel_intencion: azar(INTENCIONES),
    oferta_recomendada: problema === "notificacion_sii" ? "regularizacion_sii" : OFERTA_POR_RUTA[ruta],
    utm_source: azar(FUENTES),
    utm_campaign: Math.random() < 0.5 ? "diagnostico-lanzamiento" : null,
  });
}

const { error } = await supabase.from("diagnosticos").insert(filas);
if (error) {
  console.error("Error insertando seed:", error.message);
  process.exit(1);
}
console.log(`${filas.length} diagnósticos de prueba insertados.`);
console.log("Para limpiarlos: DELETE FROM diagnosticos WHERE token_resultado LIKE 'seed-%';");
