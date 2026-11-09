/**
 * @fisamtech/payments — public API
 *
 * Site imports:
 *   import { FisamCheckout, resolveRoute, PRICES, ... } from "@fisamtech/payments"
 *   import { createPaymentSession, verifyStripeWebhook, ... } from "@fisamtech/payments/server"
 */

export {
  SUPPORTED_CURRENCIES,
  PAYMENT_PROVIDERS,
  COUNTRY_PAYMENT_ROUTES,
  LATAM_MP_COUNTRIES,
  DEFAULT_ROUTE,
  PRICES,
  resolveRoute,
  getDiscoveryPrice,
  formatMoney,
  mpAccessTokenEnvKey,
  mpPublicKeyEnvKey,
  resolveMpAccessToken,
  resolveMpPublicKey,
  type Currency,
  type PaymentProviderId,
  type MercadoPagoSiteId,
  type CountryPaymentRoute,
  type ServicePriceKey,
} from "./config";

export type {
  PaymentStatus,
  CreatePaymentSessionInput,
  CreatePaymentSessionResult,
  PaymentResult,
  PaymentProvider,
  FisamCheckoutProps,
} from "./types";

export { FisamCheckout } from "./components/FisamCheckout";
