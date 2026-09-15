import Link from "next/link";
import type { Viewport } from "next";
import { COPY } from "@/content/copy";
import { BrandBackdrop } from "@/components/brand/BrandBackdrop";

export const metadata = {
  title: "Política de privacidad | Cris. Tributario",
};

export const viewport: Viewport = { themeColor: "#0A0F16" };

/**
 * Texto base redactado con los datos del bloque 9.2 del documento de
 * insumos, pensado para la normativa chilena (Ley 19.628 y su reforma,
 * Ley 21.719). DEBE revisarlo un abogado antes de lanzar tráfico pagado.
 * Cuando esté revisado, cambiar REVISADA_POR_ABOGADO a true.
 */
const REVISADA_POR_ABOGADO = false;

const FECHA_ACTUALIZACION = "15 de septiembre de 2026";
const RESPONSABLE = "Sociedad de Profesionales 123 Contable Limitada";
const RUT_RESPONSABLE = "77.715.077-4";
const EMAIL_CONTACTO = "cris.tributario@123contable.com";

export default function Privacidad() {
  return (
    <BrandBackdrop outerClassName="flex-1" innerClassName="flex-1 px-4 py-14">
      <div className="brand-glass brand-pop-in mx-auto max-w-2xl rounded-3xl p-6 sm:p-9">
        {!REVISADA_POR_ABOGADO && (
          <p className="mb-6 rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs px-3 py-2">
            Texto base pendiente de revisión legal antes de su publicación definitiva.
          </p>
        )}

        <h1 className="font-display text-3xl font-medium text-white">
          Política de privacidad y tratamiento de datos personales
        </h1>
        <p className="mt-2 text-xs text-white/40">
          Última actualización: {FECHA_ACTUALIZACION}
        </p>

        <div className="mt-6 space-y-6 text-sm text-white/75 leading-relaxed">
          <section>
            <h2 className="font-display text-lg text-white">1. Responsable del tratamiento</h2>
            <p>
              El responsable de los datos personales recogidos en esta plataforma
              de diagnóstico es <strong>{RESPONSABLE}</strong>, RUT{" "}
              {RUT_RESPONSABLE}, que opera la marca {COPY.marca.nombre} (
              {COPY.marca.instagram}). Contacto para todo lo relacionado con tus
              datos: <strong>{EMAIL_CONTACTO}</strong>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg text-white">2. Datos que recogemos</h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong>Tus respuestas al diagnóstico.</strong> Describen de forma
                general tu situación tributaria y patrimonial: número de
                propiedades, cómo están estructuradas, si has recibido
                notificaciones del SII y temas similares. No te pedimos RUT,
                montos exactos ni documentos.
              </li>
              <li>
                <strong>Tus datos de contacto:</strong> nombre, correo
                electrónico y, solo si decides darlo, tu número de WhatsApp.
              </li>
              <li>
                <strong>Respuestas parciales:</strong> tus respuestas se guardan a
                medida que avanzas. Si no terminas, conservamos las que alcanzaste
                a responder, sin asociarlas a tu identidad.
              </li>
              <li>
                <strong>Datos de contexto de la visita:</strong> parámetros de
                origen (UTM), identificadores de clic en anuncios, página de
                referencia, dirección IP, tipo de navegador y eventos de uso de la
                plataforma.
              </li>
            </ul>
            <p className="mt-2">
              Esta plataforma está dirigida a personas mayores de 18 años.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg text-white">3. Para qué los usamos</h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Calcular y entregarte tu diagnóstico personalizado.</li>
              <li>Enviarte tu diagnóstico por correo y darte acceso permanente a tu resultado.</li>
              <li>
                Con tu autorización expresa, enviarte contenido sobre tributación
                e inversión inmobiliaria y contactarte por correo o WhatsApp para
                ofrecerte una asesoría acorde a tu resultado.
              </li>
              <li>Analizar de forma agregada el uso de la plataforma para mejorarla.</li>
              <li>Medir la eficacia de nuestra publicidad (ver punto 7).</li>
            </ul>
            <p className="mt-2">
              <strong>No vendemos ni cedemos tus datos a terceros.</strong> Tus
              respuestas se tratan con confidencialidad y solo las ve el equipo de{" "}
              {COPY.marca.nombre}.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg text-white">4. Base legal</h2>
            <p>
              Tratamos tus datos con tu consentimiento, conforme a la{" "}
              <strong>Ley 19.628 sobre Protección de la Vida Privada</strong> y sus
              modificaciones, incluida la Ley 21.719. Otorgas ese consentimiento al
              marcar la casilla antes de enviar tus datos, y guardamos constancia
              de la fecha y hora en que lo hiciste. Puedes revocarlo cuando
              quieras.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg text-white">5. Tus derechos</h2>
            <p className="mt-2">Como titular de los datos, puedes solicitar:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Acceso a los datos que tenemos sobre ti.</li>
              <li>Rectificación de datos inexactos o incompletos.</li>
              <li>Supresión de tus datos.</li>
              <li>Oposición a su tratamiento, incluido el envío de comunicaciones comerciales.</li>
              <li>Portabilidad de tus datos.</li>
              <li>Bloqueo temporal del tratamiento.</li>
            </ul>
            <p className="mt-2">
              Para ejercerlos escribe a <strong>{EMAIL_CONTACTO}</strong>.
              Respondemos dentro de los plazos que establece la ley. Todos nuestros
              correos comerciales incluyen además un enlace para darte de baja.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg text-white">6. Quién procesa los datos</h2>
            <p>
              Usamos proveedores tecnológicos que actúan como encargados del
              tratamiento, con acceso restringido y cifrado en tránsito:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Supabase</strong> (base de datos) y <strong>Vercel</strong> (alojamiento web).</li>
              <li><strong>Resend</strong> (envío del diagnóstico por correo).</li>
              <li><strong>GoHighLevel</strong> (gestión de contactos y comunicaciones, si diste tu autorización).</li>
              <li><strong>PostHog</strong> (analítica de uso).</li>
              <li><strong>Meta Platforms</strong> (medición de publicidad, ver punto 7).</li>
            </ul>
            <p className="mt-2">
              Estos proveedores pueden almacenar datos en servidores fuera de Chile,
              principalmente en Estados Unidos, bajo sus propias garantías
              contractuales de protección de datos.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg text-white">7. Cookies y medición de publicidad</h2>
            <p>
              Esta plataforma usa el <strong>píxel de Meta</strong> y su{" "}
              <strong>API de Conversiones</strong> para medir cuántas personas
              empiezan, terminan o abandonan el diagnóstico.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong>Qué se envía:</strong> el hecho de que iniciaste,
                completaste o abandonaste el diagnóstico, la campaña de origen, tu
                dirección IP, tu tipo de navegador y las cookies publicitarias de
                Meta.
              </li>
              <li>
                <strong>Si dejas tus datos,</strong> tu correo, nombre y teléfono
                se envían a Meta cifrados de forma irreversible (hash SHA-256).
                Meta nunca recibe tus respuestas del diagnóstico.
              </li>
              <li>
                <strong>Cómo desactivarlo:</strong> bloquea estas cookies desde tu
                navegador o ajusta tus preferencias de anuncios en Facebook o
                Instagram. El diagnóstico funciona igual.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg text-white">8. Cuánto tiempo los conservamos</h2>
            <p>
              Conservamos tus datos mientras exista una relación activa contigo y
              no solicites su supresión. Los <strong>diagnósticos incompletos</strong>,
              de quien empezó y no dejó su correo, se eliminan automáticamente a los{" "}
              <strong>180 días</strong>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg text-white">9. Cambios a esta política</h2>
            <p>
              Si modificamos esta política, publicaremos la nueva versión en esta
              página con su fecha. Si el cambio afecta las finalidades del
              tratamiento, te lo comunicaremos por correo antes de aplicarlo.
            </p>
          </section>
        </div>

        <p className="mt-10">
          <Link href="/" className="text-[var(--brand-accent-light)] underline text-sm hover:text-white transition">
            Volver al inicio
          </Link>
        </p>
      </div>
    </BrandBackdrop>
  );
}
