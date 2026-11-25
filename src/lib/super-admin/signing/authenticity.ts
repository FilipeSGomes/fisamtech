import { createHash } from "node:crypto";

/** Same format as proposal authenticity codes: 16 uppercase hex chars. */
export function buildAuthenticityCode(parts: string[]): string {
  return createHash("sha256")
    .update(parts.join("|"))
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
}

export function checksumSha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function normalizeAuthenticityCode(code: string): string {
  return code.trim().toUpperCase();
}
