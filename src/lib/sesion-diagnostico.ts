"use client";

import type { Ruta } from "@/content/tipos";
import { atribucionParaEnviar } from "./utm";
import { nuevoIdBase } from "./meta-eventos";

/**
 * Estado de la sesión de diagnóstico en el navegador y envío del
 * guardado progresivo.
 *
 * Se persiste en sessionStorage para que recargar la página continúe la
 * MISMA fila en vez de crear un diagnóstico nuevo (si no, un refresco
 * inflaría artificialmente la tasa de abandono).
 */

const CLAVE_SESION = "dd_sesion_id";
const CLAVE_ID_BASE = "dd_evento_base";

function leer(clave: string): string | null {
  try {
    return sessionStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: string): void {
  try {
    sessionStorage.setItem(clave, valor);
  } catch {
    // sessionStorage bloqueado: se sigue sin persistir entre recargas.
  }
}

/** Id base de eventos de Meta, estable durante toda la sesión. */
export function idBaseDeSesion(): string {
  const existente = leer(CLAVE_ID_BASE);
  if (existente) return existente;
  const nuevo = nuevoIdBase();
  escribir(CLAVE_ID_BASE, nuevo);
  return nuevo;
}

export function sesionIdGuardado(): string | null {
  return leer(CLAVE_SESION);
}

/**
 * Las respuestas se envían en serie. Sin esto, dos clics rápidos podrían
 * lanzar dos "primeras" peticiones antes de que la primera devuelva el id
 * de sesión, y se crearían dos filas para la misma persona.
 */
let cadena: Promise<unknown> = Promise.resolve();

export interface ProgresoQuiz {
  ruta: Ruta;
  respuestas: Record<string, string>;
  /** Texto libre: pregunta abierta y detalle de "Otra cosa". */
  textos: Record<string, string>;
  ultimaPregunta: string;
}

/**
 * Guarda el avance del quiz. Nunca lanza y nunca debe esperarse desde la
 * UI: si la red falla, la persona sigue respondiendo con normalidad.
 */
export function registrarProgreso(progreso: ProgresoQuiz): Promise<void> {
  cadena = cadena.then(async () => {
    try {
      const sesionId = sesionIdGuardado();
      const respuesta = await fetch("/api/diagnostico/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // keepalive: la petición sobrevive si la persona cierra la
        // pestaña justo después de responder — que es exactamente el
        // caso que queremos medir.
        keepalive: true,
        body: JSON.stringify({
          sesionId,
          ruta: progreso.ruta,
          respuestas: progreso.respuestas,
          textos: progreso.textos,
          ultimaPregunta: progreso.ultimaPregunta,
          idBase: idBaseDeSesion(),
          // La atribución solo hace falta al crear la fila.
          atribucion: sesionId ? null : atribucionParaEnviar(),
        }),
      });
      if (!respuesta.ok) return;
      const datos = (await respuesta.json()) as { sesionId: string | null };
      if (datos.sesionId) escribir(CLAVE_SESION, datos.sesionId);
    } catch {
      // Silencio intencional: la medición nunca interrumpe el diagnóstico.
    }
  });
  return cadena as Promise<void>;
}

/** Espera a que termine el guardado en curso (antes de completar el quiz). */
export function progresoPendiente(): Promise<unknown> {
  return cadena;
}
