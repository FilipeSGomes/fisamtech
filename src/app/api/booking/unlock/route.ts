import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCalendarUrl } from "@/lib/booking/token";
import { issueBookingToken } from "@/lib/booking/issue";
import { getApprovedPaymentForLead } from "@/lib/db";

const schema = z.object({
  leadId: z.string().min(1),
  paymentId: z.string().optional(),
  /** provisional unlock for local/dev when webhook not yet configured */
  provisional: z.boolean().optional(),
});

/**
 * Issues a signed booking token after a confirmed payment.
 * Production refuses provisional unlocks. A lead id alone is not enough:
 * there must be an approved payment row for that lead.
 * Webhooks do not call this route. They sign the token themselves.
 */
export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());

    if (body.provisional) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Unlock requires verified payment" },
          { status: 403 }
        );
      }
      const token = await issueBookingToken(body.leadId, body.paymentId);
      return NextResponse.json({ token, calendarUrl: getCalendarUrl() });
    }

    const payment = await getApprovedPaymentForLead(body.leadId);
    if (!payment) {
      return NextResponse.json(
        { error: "Payment not confirmed", pending: true },
        { status: 409 }
      );
    }
    if (body.paymentId && body.paymentId !== payment.id) {
      return NextResponse.json(
        { error: "Unlock requires verified payment" },
        { status: 403 }
      );
    }

    const token = await issueBookingToken(body.leadId, payment.id);
    return NextResponse.json({ token, calendarUrl: getCalendarUrl() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unlock failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
