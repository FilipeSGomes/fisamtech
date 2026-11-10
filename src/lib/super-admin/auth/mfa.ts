import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Secret, TOTP, URI } from "otpauth";

function secretKey(): Buffer {
  const raw = process.env.ADMIN_SESSION_SECRET || process.env.BOOKING_SECRET || "";
  if (!raw || raw.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET must be set (min 16 chars) for MFA");
  }
  return createHash("sha256").update(raw).digest();
}

export function encryptMfaSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptMfaSecret(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) throw new Error("Invalid MFA secret payload");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    secretKey(),
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

export function generateTotpSecret(email: string): {
  secretBase32: string;
  otpauthUrl: string;
} {
  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: "FISAM TECH Super Admin",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
  return {
    secretBase32: secret.base32,
    otpauthUrl: totp.toString(),
  };
}

export function verifyTotp(secretBase32: string, token: string): boolean {
  const totp = new TOTP({
    issuer: "FISAM TECH Super Admin",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
  const delta = totp.validate({ token: token.replace(/\s/g, ""), window: 1 });
  return delta !== null;
}

export function parseOtpAuthUri(uri: string): string | null {
  try {
    const parsed = URI.parse(uri);
    return parsed.secret.base32;
  } catch {
    return null;
  }
}
