import { redirect } from "next/navigation";
import type { Viewport } from "next";
import { esAdmin } from "@/lib/admin-auth";
import {
  enmascarar,
  leerConfiguracion,
  origenDeClave,
  valorDeEntorno,
  type ClaveConfig,
} from "@/lib/configuracion";
import { URL_AGENDA } from "@/lib/agenda";
import { modoDemo } from "@/lib/supabase";
import { Marco } from "../ui";
import { guardarConfigAdmin, probarMetaAdmin } from "./actions";

export const metadata = { title: "Configuración | Cris. Tributario" };
export const viewport: Viewport = { themeColor: "#0A0F16" };
export const dynamic = "force-dynamic";

const ETIQUETA_ORIGEN = {
  panel: { texto: "Configurado aquí", clase: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25" },
  entorno: { texto: "Viene del entorno", clase: "bg-sky-400/10 text-sky-300 border-sky-400/25" },
  sin_configurar: { texto: "Sin configurar", clase: "bg-white/5 text-white/45 border-white/15" },
} as const;

async function Origen({
  clave,
  textoSinConfigurar,
}: {
  clave: ClaveConfig;
  /** Para claves que sí tienen un valor por defecto en el código. */
  textoSinConfigurar?: string;
}) {
  const origen = await origenDeClave(clave);
  const { texto, clase } = ETIQUETA_ORIGEN[origen];
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${clase}`}>
      {origen === "sin_configurar" ? (textoSinConfigurar ?? texto) : texto}
    </span>
  );
}

function Campo({
  nombre,
  etiqueta,
  ayuda,
  valor,
  placeholder,
  tipo = "text",
  children,
}: {
  nombre: string;
  etiqueta: string;
  ayuda: string;
  valor?: string;
  placeholder?: string;
  tipo?: string;
  children?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-white/85">{etiqueta}</span>
        {children}
      </span>
      <span className="mt-1 block text-xs text-white/45 leading-relaxed">{ayuda}</span>
      <input
        type={tipo}
        name={nombre}
        defaultValue={valor}
        placeholder={placeholder}
        autoComplete="off"
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[var(--brand-accent)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/25 transition"
      />
    </label>
  );
}

export default async function PaginaConfiguracion({
  searchParams,
}: {
  searchParams: Promise<{
    guardado?: string;
    error?: string;
    prueba?: string;
    detalle?: string;
  }>;
}) {
  if (!(await esAdmin())) redirect("/admin/login");

  const params = await searchParams;
  const config = await leerConfiguracion();
  const demo = modoDemo();

  const tokenGuardado = config.meta_capi_token ?? valorDeEntorno("meta_capi_token");

  return (
    <Marco usandoDemo={demo} activa="/admin/configuracion">
      {params.guardado && (
        <p className="mb-5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
          Configuración guardada. Los cambios se aplican en menos de un minuto, sin
          necesidad de volver a desplegar.
        </p>
      )}
      {params.error && (
        <p className="mb-5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          No se pudo guardar: {params.error}
        </p>
      )}
      {params.prueba && (
        <p
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            params.prueba === "ok"
              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
              : "border-red-400/25 bg-red-400/10 text-red-300"
          }`}
        >
          {params.prueba === "ok" ? "Conexión con Meta correcta. " : "La conexión con Meta falló. "}
          {params.detalle}
        </p>
      )}

      {demo && (
        <p className="mb-5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
          Sin base de datos conectada no se puede guardar nada desde aquí. Conecta
          Supabase y corre la migración <code>002_configuracion.sql</code>.
        </p>
      )}

      <form action={guardarConfigAdmin} className="space-y-6">
        <section className="brand-glass rounded-2xl p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="font-display text-xl text-white">Meta: pixel y API de Conversiones</h2>
            <p className="mt-1 text-sm text-white/55 leading-relaxed">
              El pixel mide desde el navegador y la API de Conversiones desde el
              servidor. Los dos usan el mismo ID de dataset, y al compartir el
              identificador de cada evento, Meta no cuenta las conversiones dos veces.
            </p>
          </div>

          <Campo
            nombre="meta_pixel_id"
            etiqueta="ID del pixel (dataset)"
            ayuda="Events Manager → tu dataset → arriba aparece el ID, solo números."
            valor={config.meta_pixel_id}
            placeholder={valorDeEntorno("meta_pixel_id") ?? "123456789012345"}
          >
            <Origen clave="meta_pixel_id" />
          </Campo>

          <div>
            <Campo
              nombre="meta_capi_token"
              etiqueta="Token de la API de Conversiones"
              ayuda="Events Manager → Configuración → API de conversiones → Generar token de acceso. Por seguridad no se muestra: si lo dejas vacío, se conserva el actual."
              tipo="password"
              placeholder={tokenGuardado ? `Guardado: ${enmascarar(tokenGuardado)}` : "Pega aquí el token"}
            >
              <Origen clave="meta_capi_token" />
            </Campo>
            {tokenGuardado && (
              <label className="mt-2 flex items-center gap-2 text-xs text-white/50">
                <input
                  type="checkbox"
                  name="borrar_token"
                  className="h-3.5 w-3.5 accent-[var(--brand-accent)]"
                />
                Borrar el token guardado
              </label>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Campo
              nombre="meta_test_event_code"
              etiqueta="Código de prueba (opcional)"
              ayuda="Events Manager → Probar eventos. Déjalo vacío en producción."
              valor={config.meta_test_event_code}
              placeholder="TEST12345"
            >
              <Origen clave="meta_test_event_code" />
            </Campo>

            <Campo
              nombre="meta_api_version"
              etiqueta="Versión de la API (opcional)"
              ayuda="Solo si Meta pide una versión distinta. Por defecto v26.0."
              valor={config.meta_api_version}
              placeholder="v26.0"
            >
              <Origen clave="meta_api_version" />
            </Campo>
          </div>
        </section>

        <section className="brand-glass rounded-2xl p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="font-display text-xl text-white">Botón de asesoría</h2>
            <p className="mt-1 text-sm text-white/55 leading-relaxed">
              A dónde lleva el botón del resultado. Déjalo vacío y lleva a la agenda
              propia (<code className="text-white/70">{URL_AGENDA}</code>): la persona
              elige día y hora ella misma. A la reserva le llegan el id del
              diagnóstico, su código y su etapa, para cruzarla con las respuestas.
              Solo cámbialo si mueves la agenda a otro calendario. Los enlaces de
              WhatsApp ya no funcionan: si pegas uno, se ignora y se agenda igual.
            </p>
          </div>

          <Campo
            nombre="url_asesoria"
            etiqueta="Enlace del botón"
            ayuda="Vacío = agenda propia. También acepta otro calendario o un link de pago."
            valor={config.url_asesoria}
            placeholder={valorDeEntorno("url_asesoria") ?? URL_AGENDA}
          >
            <Origen clave="url_asesoria" textoSinConfigurar="Usando la agenda propia" />
          </Campo>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={demo}
            className="brand-btn-cta rounded-2xl px-6 py-3 text-sm font-semibold disabled:opacity-40"
          >
            Guardar configuración
          </button>
          <button
            type="submit"
            formAction={probarMetaAdmin}
            className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm text-white/75 hover:border-[var(--brand-accent)]/40 hover:text-white transition"
          >
            Probar conexión con Meta
          </button>
        </div>
      </form>

      <p className="mt-6 text-xs text-white/40 leading-relaxed">
        Lo que se guarda aquí manda sobre las variables de entorno de Vercel. Si un
        campo queda vacío, se usa la variable de entorno como respaldo. El token nunca
        se envía al navegador: solo lo usa el servidor al enviar eventos a Meta.
      </p>
    </Marco>
  );
}
