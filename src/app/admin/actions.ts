"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import {
  cerrarSesionAdmin,
  crearSesionAdmin,
  esAdmin,
  passwordCorrecta,
} from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { permitirIntentoLogin } from "@/lib/ratelimit";
import { COOKIE_PRUEBA } from "@/lib/prueba";

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
  // Quien entra al panel es del equipo: sus diagnósticos son pruebas.
  (await cookies()).set(COOKIE_PRUEBA, "1", {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/admin");
}

export async function logoutAdmin(): Promise<void> {
  await cerrarSesionAdmin();
  redirect("/admin/login");
}

/** Corrige a mano la marca de prueba interna de un diagnóstico. */
export async function marcarPrueba(formData: FormData): Promise<void> {
  if (!(await esAdmin())) redirect("/admin/login");

  const id = String(formData.get("id") ?? "");
  const esPrueba = formData.get("es_prueba") === "1";
  const volver = String(formData.get("volver") ?? "/admin");

  const supabase = getSupabase();
  if (supabase && id) {
    const { error } = await supabase
      .from("diagnosticos")
      .update({ es_prueba: esPrueba })
      .eq("id", id);
    if (error) console.error("[admin] Error marcando prueba:", error);
  }
  redirect(volver.startsWith("/admin") ? volver : "/admin");
}
