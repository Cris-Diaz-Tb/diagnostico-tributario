import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Auth mínima del panel V0: password única (ADMIN_PASSWORD) → cookie de
 * sesión con HMAC derivado de la password. Suficiente para un panel interno
 * de una persona; si el equipo crece, migrar a Supabase Auth.
 */

const COOKIE = "dd_admin";

function firmaEsperada(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password).update("dd-admin-session").digest("hex");
}

export function passwordCorrecta(intento: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const a = Buffer.from(intento);
  const b = Buffer.from(password);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function crearSesionAdmin(): Promise<void> {
  const firma = firmaEsperada();
  if (!firma) return;
  const jar = await cookies();
  jar.set(COOKIE, firma, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12, // 12 horas
    path: "/admin",
  });
}

export async function cerrarSesionAdmin(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function esAdmin(): Promise<boolean> {
  const firma = firmaEsperada();
  if (!firma) return false;
  const jar = await cookies();
  const valor = jar.get(COOKIE)?.value;
  if (!valor || valor.length !== firma.length) return false;
  return timingSafeEqual(Buffer.from(valor), Buffer.from(firma));
}
