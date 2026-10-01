/**
 * @fisamtech/payments — central payment config.
 * Gateway is chosen by country + currency. Never route US/EU to Mercado Pago.
 * Never FX-convert BRL→other currencies in UI.
 */

export const SUPPORTED_CURRENCIES = [
  "BRL",
  "ARS",
  "MXN",
  "COP",
  "CLP",
  "PEN",
  "UYU",
  "USD",
  "EUR",
  "GBP",
] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const PAYMENT_PROVIDERS = {
  mercadopago_transparent: "mercadopago_transparent",
  stripe_embedded: "stripe_embedded",
} as const;

export type PaymentProviderId =
  (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];

/** MP site_id per official Transparent Checkout markets */
export type MercadoPagoSiteId =
  | "MLB" // Brazil
  | "MLA" // Argentina
  | "MLM" // Mexico
  | "MCO" // Colombia
  | "MLC" // Chile
  | "MPE" // Peru
  | "MLU"; // Uruguay

export type CountryPaymentRoute = {
  country: string;
  currency: Currency;
  provider: PaymentProviderId;
  mpSiteId?: MercadoPagoSiteId;
  localeHint: string;
};

/**
 * Official MP Checkout Transparente countries only.
 * US and Europe MUST use Stripe Embedded — never MP.
 */
export const COUNTRY_PAYMENT_ROUTES: Record<string, CountryPaymentRoute> = {
  BR: {
    country: "BR",
    currency: "BRL",
    provider: "mercadopago_transparent",
    mpSiteId: "MLB",
    localeHint: "pt-br",
  },
  AR: {
    country: "AR",
    currency: "ARS",
    provider: "mercadopago_transparent",
    mpSiteId: "MLA",
    localeHint: "es",
  },
  MX: {
    country: "MX",
    currency: "MXN",
    provider: "mercadopago_transparent",
    mpSiteId: "MLM",
    localeHint: "es",
  },
  CO: {
    country: "CO",
    currency: "COP",
    provider: "mercadopago_transparent",
    mpSiteId: "MCO",
    localeHint: "es",
  },
  CL: {
    country: "CL",
    currency: "CLP",
    provider: "mercadopago_transparent",
    mpSiteId: "MLC",
    localeHint: "es",
  },
  PE: {
    country: "PE",
    currency: "PEN",
    provider: "mercadopago_transparent",
    mpSiteId: "MPE",
    localeHint: "es",
  },
  UY: {
    country: "UY",
    currency: "UYU",
    provider: "mercadopago_transparent",
    mpSiteId: "MLU",
    localeHint: "es",
  },
  US: {
    country: "US",
    currency: "USD",
    provider: "stripe_embedded",
    localeHint: "en",
  },
  GB: {
    country: "GB",
    currency: "GBP",
    provider: "stripe_embedded",
    localeHint: "en",
  },
  // Eurozone samples — all Stripe Embedded / EUR
  ES: {
    country: "ES",
    currency: "EUR",
    provider: "stripe_embedded",
    localeHint: "es",
  },
  PT: {
    country: "PT",
    currency: "EUR",
    provider: "stripe_embedded",
    localeHint: "pt-pt",
  },
  FR: {
    country: "FR",
    currency: "EUR",
    provider: "stripe_embedded",
    localeHint: "fr",
  },
  DE: {
    country: "DE",
    currency: "EUR",
    provider: "stripe_embedded",
    localeHint: "de",
  },
  IE: {
    country: "IE",
    currency: "EUR",
    provider: "stripe_embedded",
    localeHint: "en",
  },
  IT: {
    country: "IT",
    currency: "EUR",
    provider: "stripe_embedded",
    localeHint: "en",
  },
  NL: {
    country: "NL",
    currency: "EUR",
    provider: "stripe_embedded",
    localeHint: "en",
  },
  AT: {
    country: "AT",
    currency: "EUR",
    provider: "stripe_embedded",
    localeHint: "de",
  },
  BE: {
    country: "BE",
    currency: "EUR",
    provider: "stripe_embedded",
    localeHint: "fr",
  },
  CA: {
    country: "CA",
    currency: "USD",
    provider: "stripe_embedded",
    localeHint: "en",
  },
  AU: {
    country: "AU",
    currency: "USD",
    provider: "stripe_embedded",
    localeHint: "en",
  },
};

export const LATAM_MP_COUNTRIES = [
  "BR",
  "AR",
  "MX",
  "CO",
  "CL",
  "PE",
  "UY",
] as const;

export const DEFAULT_ROUTE: CountryPaymentRoute = {
  country: "US",
  currency: "USD",
  provider: "stripe_embedded",
  localeHint: "en",
};

/**
 * Technical Discovery prices in minor units (cents / centavos).
 * LATAM non-BRL amounts are HYPOTHESIS placeholders — replace after market validation.
 * Do NOT derive by FX conversion from BRL.
 */
export const PRICES = {
  technical_discovery: {
    USD: { amount: 9900, note: "TEST" },
    EUR: { amount: 9900, note: "TEST" },
    GBP: { amount: 8900, note: "TEST" },
    BRL: { amount: 499000, note: "BR entry consulting aligned" },
    // HYPOTHESIS — replace after market validation (no FX from BRL)
    ARS: { amount: 12000000, note: "HYPOTHESIS — replace after market validation" }, // ~ARS 120.000
    MXN: { amount: 199000, note: "HYPOTHESIS — replace after market validation" }, // ~MXN 1.990
    COP: { amount: 45000000, note: "HYPOTHESIS — replace after market validation" }, // ~COP 450.000
    CLP: { amount: 9900000, note: "HYPOTHESIS — replace after market validation" }, // ~CLP 99.000 (CLP has no decimals typically; stored as whole pesos * 100 for consistency — adjust if using zero-decimal)
    PEN: { amount: 39900, note: "HYPOTHESIS — replace after market validation" }, // ~PEN 399
    UYU: { amount: 420000, note: "HYPOTHESIS — replace after market validation" }, // ~UYU 4.200
  },
} as const;

export type ServicePriceKey = keyof typeof PRICES;

export function resolveRoute(
  country?: string | null,
  currencyOverride?: Currency | null
): CountryPaymentRoute {
  const code = (country || "").toUpperCase();
  const base = COUNTRY_PAYMENT_ROUTES[code] ?? DEFAULT_ROUTE;
  if (currencyOverride && currencyOverride !== base.currency) {
    // Currency override: pick provider from currency family, never send US/EU currency to MP
    const latam: Currency[] = [
      "BRL",
      "ARS",
      "MXN",
      "COP",
      "CLP",
      "PEN",
      "UYU",
    ];
    if (latam.includes(currencyOverride)) {
      const mpCountry =
        Object.values(COUNTRY_PAYMENT_ROUTES).find(
          (r) => r.currency === currencyOverride
        ) ?? base;
      return { ...mpCountry, currency: currencyOverride };
    }
    return {
      ...base,
      currency: currencyOverride,
      provider: "stripe_embedded",
      mpSiteId: undefined,
    };
  }
  return base;
}

export function getDiscoveryPrice(currency: Currency): {
  amount: number;
  note: string;
} {
  const entry = PRICES.technical_discovery[currency];
  if (!entry) {
    throw new Error(`No technical_discovery price for ${currency}`);
  }
  return entry;
}

export function formatMoney(amountMinor: number, currency: Currency): string {
  // CLP/COP often treated as zero-decimal in Stripe; we store *100 consistently — display /100
  const amount = amountMinor / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: ["CLP", "COP", "JPY"].includes(currency) ? 0 : 2,
  }).format(amount);
}

/** Env key helpers — secrets server-only */
export function mpAccessTokenEnvKey(country: string): string {
  const c = country.toUpperCase();
  if (c === "BR") return "MERCADOPAGO_ACCESS_TOKEN_BR";
  return `MERCADOPAGO_ACCESS_TOKEN_${c}`;
}

export function mpPublicKeyEnvKey(country: string): string {
  const c = country.toUpperCase();
  if (c === "BR") return "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_BR";
  return `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY_${c}`;
}

export function resolveMpAccessToken(country: string): string | null {
  const specific = process.env[mpAccessTokenEnvKey(country)];
  if (specific) return specific;
  // Fallback: default token (typically BR for v1)
  return process.env.MERCADOPAGO_ACCESS_TOKEN || null;
}

export function resolveMpPublicKey(country: string): string | null {
  const specific = process.env[mpPublicKeyEnvKey(country)];
  if (specific) return specific;
  return process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || null;
}
