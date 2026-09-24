/**
 * Validación del WhatsApp del lead. Es obligatorio: por ahí se confirma
 * la asesoría que la persona agenda al final del diagnóstico.
 *
 * La regla es a propósito laxa: solo cuenta dígitos. La gente escribe
 * "+56 9 1234 5678", "9 1234 5678" o "56912345678", y rechazar formas
 * válidas cuesta leads. El formato canónico lo resuelve GoHighLevel, y
 * Meta solo necesita los dígitos para hashear.
 *
 * Vive fuera de `server-only` a propósito: el formulario y la API validan
 * con la misma función, así el navegador nunca manda algo que el servidor
 * vaya a rechazar.
 */

/** Un móvil chileno sin prefijo son 9 dígitos; 8 deja margen para fijos. */
export const MIN_DIGITOS = 8;
/** Tope de E.164. */
export const MAX_DIGITOS = 15;

export function digitosDeTelefono(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function telefonoValido(valor: string | null | undefined): boolean {
  if (!valor) return false;
  const digitos = digitosDeTelefono(valor);
  return digitos.length >= MIN_DIGITOS && digitos.length <= MAX_DIGITOS;
}
