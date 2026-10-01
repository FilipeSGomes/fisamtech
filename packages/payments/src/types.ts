import type { Currency, PaymentProviderId } from "./config";

export type PaymentStatus =
  | "requires_payment"
  | "pending"
  | "approved"
  | "failed"
  | "ignored";

export type CreatePaymentSessionInput = {
  leadId: string;
  country: string;
  currency: Currency;
  locale: string;
  customerEmail: string;
  customerName?: string;
  serviceId?: string;
  serviceName: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export type CreatePaymentSessionResult = {
  provider: PaymentProviderId;
  /** Provider session / preference / intent id */
  externalId: string;
  /** For Stripe Embedded: clientSecret. For MP Transparent: preferenceId */
  clientSecret?: string;
  preferenceId?: string;
  publicKey?: string;
  amountCents: number;
  currency: Currency;
  country: string;
  /** Missing credentials message for founder setup */
  configError?: string;
};

export type PaymentResult = {
  provider: PaymentProviderId | "stripe" | "mercadopago";
  transactionId: string;
  amount?: number;
  currency?: Currency;
  status: "approved" | "pending" | "failed" | "ignored";
  customer?: { email?: string; name?: string };
  leadId?: string;
  rawType?: string;
};

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  createSession(
    input: CreatePaymentSessionInput
  ): Promise<CreatePaymentSessionResult>;
  verifyWebhook(rawBody: string, headers: Headers): Promise<PaymentResult>;
}

export type FisamCheckoutProps = {
  session: CreatePaymentSessionResult;
  companyName?: string;
  serviceLabel: string;
  termsUrl?: string;
  privacyUrl?: string;
  cancelPolicyUrl?: string;
  onComplete?: (result: { status: string; transactionId?: string }) => void;
  onError?: (message: string) => void;
  locale?: string;
};
