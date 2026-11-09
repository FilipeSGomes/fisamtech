import Stripe from "stripe";
import type { Currency } from "../config";
import { getDiscoveryPrice } from "../config";
import type {
  CreatePaymentSessionInput,
  CreatePaymentSessionResult,
  PaymentProvider,
  PaymentResult,
} from "../types";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

/**
 * Stripe Embedded Checkout — in-site UX for USD / EUR / GBP (US, UK, Eurozone).
 * Never used for LATAM MP markets.
 */
export class StripeEmbeddedProvider implements PaymentProvider {
  readonly id = "stripe_embedded" as const;

  async createSession(
    input: CreatePaymentSessionInput
  ): Promise<CreatePaymentSessionResult> {
    const price = getDiscoveryPrice(input.currency);
    const stripe = getStripe();
    if (!stripe) {
      return {
        provider: this.id,
        externalId: "unconfigured",
        amountCents: price.amount,
        currency: input.currency,
        country: input.country,
        configError:
          "STRIPE_SECRET_KEY is empty. Add it to enable Stripe Embedded checkout.",
      };
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      mode: "payment",
      customer_email: input.customerEmail,
      return_url: `${input.successUrl}${input.successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: price.amount,
            product_data: {
              name: input.serviceName,
              metadata: { serviceId: input.serviceId ?? "technical_discovery" },
            },
          },
        },
      ],
      metadata: {
        leadId: input.leadId,
        locale: input.locale,
        country: input.country,
        serviceId: input.serviceId ?? "technical_discovery",
        ...(input.metadata ?? {}),
      },
    });

    if (!session.client_secret) {
      throw new Error("Stripe Embedded session missing client_secret");
    }

    return {
      provider: this.id,
      externalId: session.id,
      clientSecret: session.client_secret,
      publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || undefined,
      amountCents: price.amount,
      currency: input.currency,
      country: input.country,
    };
  }

  async verifyWebhook(rawBody: string, headers: Headers): Promise<PaymentResult> {
    const stripe = getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) {
      throw new Error("Stripe webhook not configured (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET)");
    }
    const signature = headers.get("stripe-signature");
    if (!signature) throw new Error("Missing stripe-signature");

    const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        provider: "stripe_embedded",
        transactionId: session.id,
        status: session.payment_status === "paid" ? "approved" : "pending",
        amount: session.amount_total ?? undefined,
        currency: (session.currency?.toUpperCase() as Currency) ?? undefined,
        leadId: session.metadata?.leadId,
        customer: {
          email: session.customer_details?.email ?? session.customer_email ?? undefined,
          name: session.customer_details?.name ?? undefined,
        },
        rawType: event.type,
      };
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      return {
        provider: "stripe_embedded",
        transactionId: session.id,
        status: "failed",
        leadId: session.metadata?.leadId,
        rawType: event.type,
      };
    }

    return {
      provider: "stripe_embedded",
      transactionId: event.id,
      status: "ignored",
      rawType: event.type,
    };
  }
}
