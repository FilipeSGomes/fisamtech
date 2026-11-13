import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCalendarUrl } from "@/lib/booking/token";
import { issueBookingToken, sendBookingEmail } from "@/lib/booking/issue";
import { getApprovedPaymentForLead, getLeadContact } from "@/lib/db";

const schema = z.object({
  leadId: z.string().min(1),
  paymentId: z.string().optional(),
  /** Free conversation path — no payment required. */
  free: z.boolean().optional(),
  /** provisional unlock for local/dev when webhook not yet configured */
  provisional: z.boolean().optional(),
});

/**
 * Issues a signed booking token.
 * Default commercial path is free scheduling after qualification.
 * If an approved payment exists for the lead, it is attached to the booking.
 */
export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const leadId = body.leadId.trim();

    if (body.provisional && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Provisional unlock disabled in production" },
        { status: 403 }
      );
    }

    const lead = await getLeadContact(leadId);
    // When the database is configured, require a real lead.
    // When it is not, ephemeral lead ids from /api/leads still unlock locally.
    if (!lead && process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const payment = await getApprovedPaymentForLead(leadId);
    if (body.paymentId && payment && body.paymentId !== payment.id) {
      return NextResponse.json(
        { error: "Payment does not match lead" },
        { status: 403 }
      );
    }

    const token = await issueBookingToken(
      leadId,
      payment?.id || body.paymentId
    );

    if (body.free || !payment) {
      try {
        await sendBookingEmail({
          leadId,
          token,
          customerEmail: lead?.email,
        });
      } catch (error) {
        console.warn("[booking/unlock] email skipped", error);
      }
    }

    return NextResponse.json({
      token,
      calendarUrl: getCalendarUrl(),
      free: !payment,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unlock failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
