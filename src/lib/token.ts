import { customAlphabet } from "nanoid";

// Sin caracteres ambiguos (0/O, 1/l/I) para que el token sea legible en el email.
const alfabeto = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
const generar = customAlphabet(alfabeto, 21);

export function generarToken(): string {
  return generar();
}
