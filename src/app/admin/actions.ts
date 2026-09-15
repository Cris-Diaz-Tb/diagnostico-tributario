"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  cerrarSesionAdmin,
  crearSesionAdmin,
  passwordCorrecta,
} from "@/lib/admin-auth";
import { permitirIntentoLogin } from "@/lib/ratelimit";

export async function loginAdmin(formData: FormData): Promise<void> {
  const encabezados = await headers();
  const ip =
    encabezados.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";

  // Anti fuerza bruta: 5 intentos por minuto por IP. Se cuenta ANTES de
  // validar para que también los intentos fallidos consuman cupo.
  if (!permitirIntentoLogin(ip)) {
    redirect("/admin/login?error=limite");
  }

  const password = String(formData.get("password") ?? "");
  if (!passwordCorrecta(password)) {
    redirect("/admin/login?error=1");
  }
  await crearSesionAdmin();
  redirect("/admin");
}

export async function logoutAdmin(): Promise<void> {
  await cerrarSesionAdmin();
  redirect("/admin/login");
}
