import { resolveRoute, type Currency } from "../config";
import { MercadoPagoTransparentProvider } from "../providers/mercadopago-transparent";
import { StripeEmbeddedProvider } from "../providers/stripe-embedded";
import type {
  CreatePaymentSessionInput,
  CreatePaymentSessionResult,
  PaymentProvider,
  PaymentResult,
} from "../types";

const stripeEmbedded = new StripeEmbeddedProvider();
const mpTransparent = new MercadoPagoTransparentProvider();

export function getProviderForCountry(
  country: string,
  currency?: Currency | null
): PaymentProvider {
  const route = resolveRoute(country, currency);
  if (route.provider === "mercadopago_transparent") return mpTransparent;
  return stripeEmbedded;
}

/** Payment Service facade — site should only call this */
export async function createPaymentSession(
  input: CreatePaymentSessionInput
): Promise<CreatePaymentSessionResult> {
  const route = resolveRoute(input.country, input.currency);
  // Enforce: never MP for non-LATAM
  if (
    route.provider === "mercadopago_transparent" &&
    !["BR", "AR", "MX", "CO", "CL", "PE", "UY"].includes(
      input.country.toUpperCase()
    )
  ) {
    throw new Error(
      `Mercado Pago Transparent is not available for ${input.country}. Use Stripe Embedded.`
    );
  }
  const provider = getProviderForCountry(input.country, input.currency);
  return provider.createSession({
    ...input,
    currency: route.currency,
    country: route.country === "US" && !input.country ? "US" : input.country,
  });
}

export async function verifyStripeWebhook(
  rawBody: string,
  headers: Headers
): Promise<PaymentResult> {
  return stripeEmbedded.verifyWebhook(rawBody, headers);
}

export async function verifyMercadoPagoWebhook(
  rawBody: string,
  headers: Headers
): Promise<PaymentResult> {
  return mpTransparent.verifyWebhook(rawBody, headers);
}

export { StripeEmbeddedProvider, MercadoPagoTransparentProvider };
