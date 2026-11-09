import { createHmac, timingSafeEqual, createHash } from "crypto";
import { CALENDAR_LINKS } from "@/lib/config";

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function getSecret(): string {
  const secret = process.env.BOOKING_SECRET;
  if (!secret) {
    // Dev fallback — never use in production
    return "dev-booking-secret-change-me";
  }
  return secret;
}

export type BookingTokenPayload = {
  leadId: string;
  paymentId?: string;
  exp: number;
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function signBookingToken(
  payload: Omit<BookingTokenPayload, "exp">,
  ttlMs = DEFAULT_TTL_MS
): string {
  const body: BookingTokenPayload = {
    ...payload,
    exp: Date.now() + ttlMs,
  };
  const data = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyBookingToken(token: string): BookingTokenPayload | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = createHmac("sha256", getSecret())
    .update(data)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    ) as BookingTokenPayload;
    if (!payload.leadId || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getCalendarUrl(): string {
  return CALENDAR_LINKS.technical_discovery;
}
