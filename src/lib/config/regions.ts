import type { Currency } from "@fisamtech/payments";

/** Mirrors Locale in index.ts — kept local to avoid circular imports */
type Locale = "en" | "pt-br" | "pt-pt" | "es" | "fr" | "de";

export type RegionGroup = "primary" | "latam";

export type RegionPreset = {
  id: string;
  country: string;
  locale: Locale;
  currency: Currency;
  flag: string;
  /** Short country code shown next to flag when closed */
  code: string;
  group: RegionGroup;
  /** Currency symbol for human display */
  currencySymbol: string;
};

/**
 * One-tap presets: each row sets locale + currency + country together.
 * Flag is the primary visual cue.
 */
export const REGION_PRESETS: RegionPreset[] = [
  {
    id: "br",
    country: "BR",
    locale: "pt-br",
    currency: "BRL",
    flag: "🇧🇷",
    code: "BR",
    group: "primary",
    currencySymbol: "R$",
  },
  {
    id: "us",
    country: "US",
    locale: "en",
    currency: "USD",
    flag: "🇺🇸",
    code: "US",
    group: "primary",
    currencySymbol: "$",
  },
  {
    id: "gb",
    country: "GB",
    locale: "en",
    currency: "GBP",
    flag: "🇬🇧",
    code: "GB",
    group: "primary",
    currencySymbol: "£",
  },
  {
    id: "es",
    country: "ES",
    locale: "es",
    currency: "EUR",
    flag: "🇪🇸",
    code: "ES",
    group: "primary",
    currencySymbol: "€",
  },
  {
    id: "fr",
    country: "FR",
    locale: "fr",
    currency: "EUR",
    flag: "🇫🇷",
    code: "FR",
    group: "primary",
    currencySymbol: "€",
  },
  {
    id: "de",
    country: "DE",
    locale: "de",
    currency: "EUR",
    flag: "🇩🇪",
    code: "DE",
    group: "primary",
    currencySymbol: "€",
  },
  {
    id: "pt",
    country: "PT",
    locale: "pt-pt",
    currency: "EUR",
    flag: "🇵🇹",
    code: "PT",
    group: "primary",
    currencySymbol: "€",
  },
  {
    id: "ar",
    country: "AR",
    locale: "es",
    currency: "ARS",
    flag: "🇦🇷",
    code: "AR",
    group: "latam",
    currencySymbol: "$",
  },
  {
    id: "mx",
    country: "MX",
    locale: "es",
    currency: "MXN",
    flag: "🇲🇽",
    code: "MX",
    group: "latam",
    currencySymbol: "$",
  },
  {
    id: "co",
    country: "CO",
    locale: "es",
    currency: "COP",
    flag: "🇨🇴",
    code: "CO",
    group: "latam",
    currencySymbol: "$",
  },
  {
    id: "cl",
    country: "CL",
    locale: "es",
    currency: "CLP",
    flag: "🇨🇱",
    code: "CL",
    group: "latam",
    currencySymbol: "$",
  },
  {
    id: "pe",
    country: "PE",
    locale: "es",
    currency: "PEN",
    flag: "🇵🇪",
    code: "PE",
    group: "latam",
    currencySymbol: "S/",
  },
  {
    id: "uy",
    country: "UY",
    locale: "es",
    currency: "UYU",
    flag: "🇺🇾",
    code: "UY",
    group: "latam",
    currencySymbol: "$",
  },
];

/** Fallback when locale has no matching country cookie */
const LOCALE_DEFAULT_PRESET: Record<Locale, string> = {
  "pt-br": "br",
  en: "us",
  "pt-pt": "pt",
  es: "es",
  fr: "fr",
  de: "de",
};

export function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export function findPresetByCountry(country?: string | null): RegionPreset | undefined {
  if (!country) return undefined;
  return REGION_PRESETS.find((p) => p.country === country.toUpperCase());
}

export function resolveActivePreset(
  locale: Locale,
  country?: string | null,
  currency?: string | null
): RegionPreset {
  if (country) {
    const byCountry = findPresetByCountry(country);
    if (byCountry) return byCountry;
  }
  if (currency) {
    const byCurrency = REGION_PRESETS.find(
      (p) => p.currency === currency && p.locale === locale
    );
    if (byCurrency) return byCurrency;
    const anyCurrency = REGION_PRESETS.find((p) => p.currency === currency);
    if (anyCurrency) return anyCurrency;
  }
  const fallbackId = LOCALE_DEFAULT_PRESET[locale] ?? "us";
  return REGION_PRESETS.find((p) => p.id === fallbackId) ?? REGION_PRESETS[1];
}

export const REGION_CONFIRMED_KEY = "fisam_region_confirmed";
