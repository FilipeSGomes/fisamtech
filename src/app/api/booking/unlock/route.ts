import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  signBookingToken,
  hashToken,
  getCalendarUrl,
} from "@/lib/booking/token";
import { insertBooking } from "@/lib/db";

const schema = z.object({
  leadId: z.string().min(1),
  paymentId: z.string().optional(),
  /** provisional unlock for local/dev when webhook not yet configured */
  provisional: z.boolean().optional(),
});

/**
 * Issues a signed booking token after payment approval.
 * Production path: called from webhook handlers.
 * provisional=true allows success-page flow in local without live webhooks
 * (still requires BOOKING_SECRET; calendar remains gated by token validity).
 */
export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const allowProvisional =
      body.provisional && process.env.NODE_ENV !== "production";

    if (!allowProvisional && !body.paymentId) {
      // In production without paymentId, refuse — webhook must drive unlock
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Unlock requires verified payment" },
          { status: 403 }
        );
      }
    }

    const token = signBookingToken({
      leadId: body.leadId,
      paymentId: body.paymentId,
    });

    await insertBooking({
      lead_id: body.leadId,
      payment_id: body.paymentId,
      token_hash: hashToken(token),
      expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      calendar_url: getCalendarUrl(),
      status: "unlocked",
    });

    return NextResponse.json({ token, calendarUrl: getCalendarUrl() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unlock failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
