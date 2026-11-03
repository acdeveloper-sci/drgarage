import { randomBytes } from "node:crypto";

// 256 bits aleatorios en base64url (43 caracteres). No usar crypto.randomUUID(): solo aporta 122 bits.
export function generarTokenPublico(): string {
  return randomBytes(32).toString("base64url");
}
