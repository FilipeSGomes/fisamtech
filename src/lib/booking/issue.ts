import { isLocale } from "@/lib/config";
import { getLeadContact, insertBooking } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getCalendarUrl, hashToken, signBookingToken } from "@/lib/booking/token";

function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://www.fisamtech.com";
  return raw.replace(/\/$/, "");
}

export function bookingUrl(locale: string, token: string): string {
  const safeLocale = isLocale(locale) ? locale : "pt-br";
  return `${siteOrigin()}/${safeLocale}/book?token=${encodeURIComponent(token)}`;
}

/** Signs a /book token and stores its hash. The raw token is returned to the payer, not kept in the database. */
export async function issueBookingToken(
  leadId: string,
  paymentId?: string
): Promise<string> {
  const token = signBookingToken({ leadId, paymentId });
  await insertBooking({
    lead_id: leadId,
    payment_id: paymentId,
    token_hash: hashToken(token),
    expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    calendar_url: getCalendarUrl(),
    status: "unlocked",
  });
  return token;
}

export async function sendBookingEmail(opts: {
  leadId: string;
  token: string;
  customerEmail?: string | null;
}): Promise<void> {
  const lead = await getLeadContact(opts.leadId);
  const to = opts.customerEmail || lead?.email;
  if (!to) return;
  const locale = lead?.locale && isLocale(lead.locale) ? lead.locale : "pt-br";
  await sendEmail({
    to,
    subject: "FISAM TECH: link para agendar o diagnóstico técnico",
    template: "booking_unlocked",
    vars: {
      leadId: opts.leadId,
      bookUrl: bookingUrl(locale, opts.token),
    },
  });
}
