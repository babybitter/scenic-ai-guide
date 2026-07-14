// Password hashing for admin accounts (scrypt with a per-hash random salt).
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(plain) {
  const salt = randomBytes(16);
  const derived = scryptSync(String(plain), salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(plain, stored) {
  if (typeof stored !== "string" || !stored.startsWith("scrypt$")) {
    return false;
  }
  const [, saltHex, hashHex] = stored.split("$");
  if (!saltHex || !hashHex) {
    return false;
  }
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = scryptSync(String(plain), salt, expected.length);
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
