import { describe, expect, it } from "vitest";
import { generarTokenPublico } from "./token";

describe("generarTokenPublico (Property 5)", () => {
  const tokens = Array.from({ length: 5000 }, generarTokenPublico);

  it("tiene al menos 128 bits: son 32 bytes aleatorios (256 bits)", () => {
    for (const token of tokens) expect(Buffer.from(token, "base64url").length * 8).toBeGreaterThanOrEqual(256);
  });

  it("se puede usar en una URL: base64url de 43 caracteres, sin relleno", () => {
    for (const token of tokens) expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("es distinto en cada llamada", () => {
    expect(new Set(tokens).size).toBe(tokens.length);
  });
});
