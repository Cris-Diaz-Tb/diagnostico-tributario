import "server-only";
import { Resend } from "resend";
import { ctaEfectivo, etapaDeFase, roadmapDeFase } from "@/content/roadmaps";
import { NOMBRE_RUTA } from "@/content/preguntas";
import { COPY } from "@/content/copy";
import { urlAsesoria } from "@/lib/agenda";
import type { FaseId, Ruta } from "@/content/tipos";

/**
 * Envío del diagnóstico por email vía Resend.
 * Sin RESEND_API_KEY → no-op con log visible (la app sigue funcionando).
 *
 * Layout de tablas y colores sólidos (sin blur, gradientes ni fuentes
 * custom) porque esos efectos no son fiables en clientes de correo.
 */

// Paleta email-safe en hex sólido: navy de la marca + teal de acento.
const COLOR = {
  fondo: "#0a0f16",
  tarjeta: "#131e2c",
  borde: "#22303e",
  acento: "#1da898",
  acentoClaro: "#38d0be",
  acentoTinte: "#0f2a2a",
  texto: "#f3f1ec",
  textoMuted: "#9aa6b2",
} as const;

interface EnvioDiagnostico {
  para: string;
  nombre: string | null;
  fase: FaseId;
  token: string;
  /** Problema principal marcado: decide el CTA específico. */
  tag?: string | null;
  /** Id del diagnóstico: viaja al enlace de asesoría. */
  identificador?: string | null;
}

export async function enviarRoadmapPorEmail({
  para,
  nombre,
  fase,
  token,
  tag = null,
  identificador = null,
}: EnvioDiagnostico): Promise<{ enviado: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn(
      `[email] RESEND_API_KEY/EMAIL_FROM no configuradas: no se envió el diagnóstico a ${para} (fase ${fase}).`
    );
    return { enviado: false };
  }

  const roadmap = roadmapDeFase(fase);
  const ruta = fase[0] as Ruta;
  const urlResultado = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/resultado/${token}`;
  const saludo = nombre ? `Hola ${escaparHtml(nombre)},` : "Hola,";
  const enlaceAsesoria =
    (await urlAsesoria(identificador ?? token, roadmap.parteA.titulo)) ??
    COPY.marca.instagramUrl;
  const botonAsesoria = enlaceAsesoria.includes("instagram.com")
    ? COPY.resultado.ctaSinEnlace
    : COPY.resultado.ctaBoton;
  const fuente = "font-family: Helvetica, Arial, sans-serif;";

  const filasPasos = roadmap.parteB.pasos
    .map(
      (paso, i) => `
      <tr>
        <td width="36" valign="top" style="padding: 0 12px 18px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="28" height="28" style="background-color:${COLOR.acento}; border-radius:50%;">
            <tr><td align="center" valign="middle" style="color:#0a0f16; font-size:13px; font-weight:700; ${fuente}">${i + 1}</td></tr>
          </table>
        </td>
        <td valign="top" style="padding: 0 0 18px 0; color:${COLOR.texto}; font-size:14px; line-height:1.6; ${fuente}">
          ${paso}
        </td>
      </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<title>${COPY.email.asunto()}</title>
</head>
<body style="margin:0; padding:0; background-color:${COLOR.fondo};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.fondo};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%;">

          <tr>
            <td align="center" style="padding-bottom:24px; ${fuente} font-size:12px; font-weight:700; letter-spacing:2px; color:${COLOR.textoMuted}; text-transform:uppercase;">
              ${COPY.marca.nombre}
            </td>
          </tr>

          <tr>
            <td style="padding-bottom:20px; ${fuente} font-size:15px; line-height:1.6; color:${COLOR.texto};">
              <p style="margin:0 0 12px 0;">${saludo}</p>
              <p style="margin:0; color:${COLOR.textoMuted};">${COPY.email.intro}</p>
            </td>
          </tr>

          <tr>
            <td style="background-color:${COLOR.tarjeta}; border:1px solid ${COLOR.borde}; border-radius:16px; padding:28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:${COLOR.acentoTinte}; border:1px solid ${COLOR.acento}; border-radius:999px; padding:6px 14px; ${fuente} font-size:11px; font-weight:700; letter-spacing:0.5px; color:${COLOR.acentoClaro}; text-transform:uppercase;">
                    ${COPY.resultado.etiquetaFase(NOMBRE_RUTA[ruta], etapaDeFase(fase))}
                  </td>
                </tr>
              </table>

              <h1 style="margin:16px 0 0 0; ${fuente} font-size:22px; font-weight:700; color:#ffffff;">
                ${roadmap.parteA.titulo}
              </h1>
              <p style="margin:12px 0 0 0; ${fuente} font-size:14px; line-height:1.65; color:${COLOR.textoMuted};">
                ${roadmap.parteA.diagnostico}
              </p>

              <h2 style="margin:28px 0 16px 0; ${fuente} font-size:16px; font-weight:700; color:#ffffff;">
                ${COPY.resultado.tusPasos}
              </h2>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                ${filasPasos}
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border:1px solid ${COLOR.acento}; border-radius:12px;">
                    <a href="${urlResultado}" style="display:inline-block; padding:14px 26px; ${fuente} font-size:14px; font-weight:700; color:${COLOR.acentoClaro}; text-decoration:none;">
                      ${COPY.email.linkTexto}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="background-color:${COLOR.tarjeta}; border:1px solid ${COLOR.borde}; border-radius:16px; padding:28px;">
              <p style="margin:0 0 6px 0; ${fuente} font-size:16px; font-weight:700; color:#ffffff;">
                ${COPY.resultado.ctaTitulo}
              </p>
              <p style="margin:0 0 20px 0; ${fuente} font-size:13px; line-height:1.6; color:${COLOR.textoMuted};">
                ${ctaEfectivo(roadmap, tag)}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:${COLOR.acento}; border-radius:10px;">
                    <a href="${escaparHtml(enlaceAsesoria)}" style="display:inline-block; padding:13px 24px; ${fuente} font-size:13px; font-weight:700; color:#0a0f16; text-decoration:none;">
                      ${botonAsesoria}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 0 0 0; ${fuente} font-size:12px; line-height:1.6; color:${COLOR.textoMuted}; white-space:pre-line;">
              ${COPY.email.despedida}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 12px 0 12px; ${fuente} font-size:11px; line-height:1.5; color:#6b7682;">
              ${COPY.avisoLegal}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: para,
      subject: COPY.email.asunto(),
      html,
    });
    if (error) {
      console.error("[email] Error de Resend:", error);
      return { enviado: false };
    }
    return { enviado: true };
  } catch (err) {
    console.error("[email] Fallo enviando el diagnóstico:", err);
    return { enviado: false };
  }
}

function escaparHtml(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
