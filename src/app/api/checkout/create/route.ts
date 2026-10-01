import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createPaymentSession,
} from "@fisamtech/payments/server";
import { resolveRoute, type Currency } from "@fisamtech/payments";
import { SUPPORTED_CURRENCIES } from "@fisamtech/payments";

const schema = z.object({
  leadId: z.string().min(1),
  country: z.string().min(2),
  currency: z.string(),
  locale: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const currency = body.currency.toUpperCase() as Currency;
    if (!(SUPPORTED_CURRENCIES as readonly string[]).includes(currency)) {
      return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
    }

    const route = resolveRoute(body.country, currency);
    const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const locale = body.locale || route.localeHint;

    const session = await createPaymentSession({
      leadId: body.leadId,
      country: body.country.toUpperCase(),
      currency: route.currency,
      locale,
      customerEmail: body.email || "checkout@fisamtech.com",
      customerName: body.name,
      serviceId: "technical_discovery",
      serviceName: "Technical Discovery — FISAM TECH",
      successUrl: `${site}/${locale}/checkout/success?leadId=${encodeURIComponent(body.leadId)}`,
      cancelUrl: `${site}/${locale}/qualify`,
    });

    return NextResponse.json({ session });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout create failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
