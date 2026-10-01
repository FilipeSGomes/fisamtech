import { NextRequest, NextResponse } from "next/server";
import { verifyMercadoPagoWebhook } from "@fisamtech/payments/server";
import { upsertPayment, insertBooking, trackEventServer } from "@/lib/db";
import {
  signBookingToken,
  hashToken,
  getCalendarUrl,
} from "@/lib/booking/token";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  try {
    const result = await verifyMercadoPagoWebhook(rawBody, req.headers);

    if (result.status === "ignored") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const payment = await upsertPayment({
      lead_id: result.leadId,
      provider: "mercadopago",
      transaction_id: result.transactionId,
      status: result.status,
      amount_cents: result.amount,
      currency: result.currency,
      service_id: "technical_discovery",
      raw: { provider: result.provider, rawType: result.rawType },
    });

    if (result.status === "approved" && result.leadId) {
      const token = signBookingToken({
        leadId: result.leadId,
        paymentId: "id" in payment ? payment.id : undefined,
      });
      await insertBooking({
        lead_id: result.leadId,
        payment_id: "id" in payment ? payment.id : undefined,
        token_hash: hashToken(token),
        expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
        calendar_url: getCalendarUrl(),
        status: "unlocked",
      });
      await trackEventServer({
        name: "payment_success",
        lead_id: result.leadId,
        properties: {
          provider: "mercadopago",
          transactionId: result.transactionId,
        },
      });
      if (result.customer?.email) {
        await sendEmail({
          to: result.customer.email,
          subject: "FISAM TECH — Diagnóstico técnico liberado",
          template: "booking_unlocked",
          vars: { leadId: result.leadId },
        });
      }
    }

    return NextResponse.json({ ok: true, status: result.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook error";
    console.error("[webhook:mp]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
