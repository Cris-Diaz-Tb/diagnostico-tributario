"use server";

import { redirect } from "next/navigation";
import { esAdmin } from "@/lib/admin-auth";
import { guardarConfiguracion, type Configuracion } from "@/lib/configuracion";
import { probarCredencialesMeta } from "@/lib/meta-capi";

/**
 * Guarda la configuración editada en el panel.
 *
 * El token de la API de Conversiones se trata distinto al resto: el
 * formulario nunca lo muestra, así que un campo vacío significa "déjalo
 * como está", no "bórralo". Para borrarlo hay que marcar la casilla.
 */
export async function guardarConfigAdmin(formData: FormData): Promise<void> {
  if (!(await esAdmin())) redirect("/admin/login");

  const texto = (campo: string) => String(formData.get(campo) ?? "").trim();

  const cambios: Configuracion = {
    meta_pixel_id: texto("meta_pixel_id"),
    meta_test_event_code: texto("meta_test_event_code"),
    meta_api_version: texto("meta_api_version"),
    url_asesoria: texto("url_asesoria"),
  };

  const tokenNuevo = texto("meta_capi_token");
  const borrarToken = formData.get("borrar_token") === "on";
  if (borrarToken) cambios.meta_capi_token = "";
  else if (tokenNuevo) cambios.meta_capi_token = tokenNuevo;

  const resultado = await guardarConfiguracion(cambios);
  if (!resultado.guardado) {
    redirect(`/admin/configuracion?error=${encodeURIComponent(resultado.error ?? "1")}`);
  }
  redirect("/admin/configuracion?guardado=1");
}

/** Comprueba las credenciales de Meta sin enviar eventos de prueba. */
export async function probarMetaAdmin(): Promise<void> {
  if (!(await esAdmin())) redirect("/admin/login");

  const { ok, detalle } = await probarCredencialesMeta();
  redirect(
    `/admin/configuracion?prueba=${ok ? "ok" : "fallo"}&detalle=${encodeURIComponent(detalle)}`
  );
}
