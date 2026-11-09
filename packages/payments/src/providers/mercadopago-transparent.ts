import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import type { Currency } from "../config";
import {
  getDiscoveryPrice,
  resolveMpAccessToken,
  resolveMpPublicKey,
  resolveRoute,
} from "../config";
import type {
  CreatePaymentSessionInput,
  CreatePaymentSessionResult,
  PaymentProvider,
  PaymentResult,
} from "../types";

/**
 * Mercado Pago Checkout Transparente — in-site for official LATAM markets only:
 * BR, AR, MX, CO, CL, PE, UY. Never use for US/EU.
 *
 * v1 creates a Preference for Brick / Wallet Brick embedding.
 * Per-country access tokens: MERCADOPAGO_ACCESS_TOKEN_BR|_AR|_MX|_CO|_CL|_PE|_UY
 * Fallback: MERCADOPAGO_ACCESS_TOKEN (typically BR).
 */
export class MercadoPagoTransparentProvider implements PaymentProvider {
  readonly id = "mercadopago_transparent" as const;

  async createSession(
    input: CreatePaymentSessionInput
  ): Promise<CreatePaymentSessionResult> {
    const route = resolveRoute(input.country, input.currency);
    const price = getDiscoveryPrice(input.currency);
    const token = resolveMpAccessToken(input.country);

    if (!token) {
      return {
        provider: this.id,
        externalId: "unconfigured",
        amountCents: price.amount,
        currency: input.currency,
        country: input.country,
        publicKey: resolveMpPublicKey(input.country) || undefined,
        configError: `Mercado Pago access token missing for ${input.country}. Set MERCADOPAGO_ACCESS_TOKEN_${input.country.toUpperCase() === "BR" ? "BR" : input.country.toUpperCase()} or MERCADOPAGO_ACCESS_TOKEN.`,
      };
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);
    const unitPrice = price.amount / 100;

    const result = await preference.create({
      body: {
        external_reference: input.leadId,
        items: [
          {
            id: input.serviceId ?? "technical_discovery",
            title: input.serviceName,
            quantity: 1,
            unit_price: unitPrice,
            currency_id: input.currency,
          },
        ],
        payer: {
          email: input.customerEmail,
          name: input.customerName,
        },
        back_urls: {
          success: input.successUrl,
          failure: input.cancelUrl,
          pending: input.successUrl.replace("/success", "/pending"),
        },
        auto_return: "approved",
        metadata: {
          leadId: input.leadId,
          locale: input.locale,
          country: input.country,
          mpSiteId: route.mpSiteId ?? "",
          serviceId: input.serviceId ?? "technical_discovery",
          ...(input.metadata ?? {}),
        },
      },
    });

    if (!result.id) {
      throw new Error("Mercado Pago preference missing id");
    }

    return {
      provider: this.id,
      externalId: String(result.id),
      preferenceId: String(result.id),
      publicKey: resolveMpPublicKey(input.country) || undefined,
      amountCents: price.amount,
      currency: input.currency,
      country: input.country,
    };
  }

  async verifyWebhook(rawBody: string, headers: Headers): Promise<PaymentResult> {
    // Optional signature presence when secret set
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (secret) {
      const xSignature = headers.get("x-signature");
      const xRequestId = headers.get("x-request-id");
      if (!xSignature || !xRequestId) {
        throw new Error("Missing Mercado Pago signature headers");
      }
    }

    let payload: { type?: string; action?: string; data?: { id?: string } };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return {
        provider: "mercadopago_transparent",
        transactionId: "unknown",
        status: "ignored",
      };
    }

    const paymentId = payload.data?.id;
    if (!paymentId) {
      return {
        provider: "mercadopago_transparent",
        transactionId: "unknown",
        status: "ignored",
        rawType: payload.type,
      };
    }

    // Prefer BR token then generic — webhook may not include country
    const token =
      resolveMpAccessToken("BR") ||
      process.env.MERCADOPAGO_ACCESS_TOKEN ||
      null;
    if (!token) {
      throw new Error("No Mercado Pago token available to fetch payment");
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const paymentApi = new Payment(client);
    const payment = await paymentApi.get({ id: paymentId });

    const statusMap: Record<string, PaymentResult["status"]> = {
      approved: "approved",
      pending: "pending",
      in_process: "pending",
      rejected: "failed",
      cancelled: "failed",
    };

    return {
      provider: "mercadopago_transparent",
      transactionId: String(paymentId),
      status: statusMap[payment.status ?? ""] ?? "ignored",
      amount: payment.transaction_amount
        ? Math.round(payment.transaction_amount * 100)
        : undefined,
      currency: (payment.currency_id as Currency) ?? undefined,
      leadId: payment.external_reference ?? undefined,
      customer: {
        email: payment.payer?.email ?? undefined,
      },
      rawType: payload.type ?? payload.action,
    };
  }
}
