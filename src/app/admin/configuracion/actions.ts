"use server";

import { redirect } from "next/navigation";
import { esAdmin } from "@/lib/admin-auth";
import { guardarConfiguracion, type Configuracion } from "@/lib/configuracion";
import { probarCredencialesMeta } from "@/lib/meta-capi";
import { filaDePrueba, payloadDeFila, postWebhook, urlWebhookDatos } from "@/lib/webhook-datos";

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
    whatsapp_numero: texto("whatsapp_numero"),
    url_webinar: texto("url_webinar"),
    webhook_datos_url: texto("webhook_datos_url"),
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

/** Manda un diagnóstico de ejemplo (es_prueba: true) al webhook de datos. */
export async function probarWebhookAdmin(): Promise<void> {
  if (!(await esAdmin())) redirect("/admin/login");

  const url = await urlWebhookDatos();
  const ok = url ? await postWebhook(url, payloadDeFila(filaDePrueba(), "diagnostico.prueba")) : false;
  const detalle = !url
    ? "No hay URL del webhook guardada."
    : ok
      ? "El webhook recibió el diagnóstico de ejemplo."
      : "El webhook no respondió 2xx. Revisa la URL y que el flujo esté activo.";
  redirect(
    `/admin/configuracion?webhook=${ok ? "ok" : "fallo"}&detalle=${encodeURIComponent(detalle)}`
  );
}
