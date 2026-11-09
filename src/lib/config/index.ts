/** Site-level commercial config — payment routing lives in @fisamtech/payments */

export {
  SUPPORTED_CURRENCIES,
  type Currency,
  COUNTRY_PAYMENT_ROUTES,
  resolveRoute,
  PRICES,
  getDiscoveryPrice,
  formatMoney,
  LATAM_MP_COUNTRIES,
} from "@fisamtech/payments";

export const SUPPORTED_LANGUAGES = [
  "en",
  "pt-br",
  "pt-pt",
  "es",
  "fr",
  "de",
] as const;

export type Locale = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "pt-br": "Português (Brasil)",
  "pt-pt": "Português (Portugal)",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
};

/** Country → suggested locale (currency/provider via @fisamtech/payments resolveRoute) */
export const COUNTRY_MAPPING: Record<
  string,
  { locale: Locale }
> = {
  BR: { locale: "pt-br" },
  AR: { locale: "es" },
  MX: { locale: "es" },
  CO: { locale: "es" },
  CL: { locale: "es" },
  PE: { locale: "es" },
  UY: { locale: "es" },
  US: { locale: "en" },
  GB: { locale: "en" },
  PT: { locale: "pt-pt" },
  ES: { locale: "es" },
  FR: { locale: "fr" },
  DE: { locale: "de" },
  IE: { locale: "en" },
  IT: { locale: "en" },
  NL: { locale: "en" },
  AT: { locale: "de" },
  BE: { locale: "fr" },
  CA: { locale: "en" },
  AU: { locale: "en" },
};

export const TIMEZONES = {
  "pt-br": "America/Sao_Paulo",
  "pt-pt": "Europe/Lisbon",
  en: "America/New_York",
  es: "Europe/Madrid",
  fr: "Europe/Paris",
  de: "Europe/Berlin",
} as const satisfies Record<Locale, string>;

export const SERVICES = {
  technical_discovery: "technical_discovery",
  systems_architecture: "systems_architecture",
  backend_engineering: "backend_engineering",
  critical_integrations: "critical_integrations",
  genai_governance: "genai_governance",
  legacy_modernization: "legacy_modernization",
} as const;

export type ServiceId = (typeof SERVICES)[keyof typeof SERVICES];

export const LEAD_SOURCES = [
  "homepage",
  "qualification",
  "partners",
  "service_page",
  "cases",
  "direct",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

export const CALENDAR_LINKS = {
  technical_discovery:
    process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL ||
    "https://calendar.app.google/Gzv4jkEqaAniaBKr5",
} as const;

export const WHATSAPP = {
  e164: "5511979562271",
  display: "+55 11 97956-2271",
  url: "https://wa.me/5511979562271",
} as const;

export const CONTACT = {
  email: "contato@fisamtech.com",
  company: "FISAM TECH",
  cnpj: "59.897.573/0001-02",
} as const;

/** Fixed project budget bands for qualification (amounts in selected currency). */
export const BUDGET_RANGES = [
  { id: "2500-10000", min: 2_500, max: 10_000 },
  { id: "10000-50000", min: 10_000, max: 50_000 },
  { id: "50000-150000", min: 50_000, max: 150_000 },
  { id: "150000-500000", min: 150_000, max: 500_000 },
  { id: "500000+", min: 500_000, max: null },
] as const;

export type BudgetRangeId = (typeof BUDGET_RANGES)[number]["id"];

export const BUDGET_RANGE_IDS = BUDGET_RANGES.map((r) => r.id) as [
  BudgetRangeId,
  ...BudgetRangeId[],
];

export function formatBudgetRangeLabel(
  range: (typeof BUDGET_RANGES)[number],
  locale: string
): string {
  const fmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  if (range.max == null) return `${fmt.format(range.min)}+`;
  return `${fmt.format(range.min)} – ${fmt.format(range.max)}`;
}

export const PRODUCTS = [
  { name: "FISAM Quote", url: "https://quote.fisamtech.com" },
  { name: "Kontrolla", url: "https://kontrolla.app" },
  { name: "FNRH", url: "https://fnrh.fisamtech.com" },
  { name: "FinTrack", url: "https://fintrack.fisamtech.com" },
  { name: "FISAM Tour", url: "https://fisamtour.com" },
  { name: "Ponto", url: "https://ponto.fisamtour.com" },
] as const;

/** Founder PRIOR experience — never present as FISAM clients */
export const FOUNDER_PRIOR_EXPERIENCE = [
  "Bradesco",
  "B3",
  "Itaú",
  "Banco Next",
  "Capgemini Engineering",
  "Gerdau",
] as const;

export const FISAM_CLIENTS = ["SigaBR", "637 Tennis Club"] as const;

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const CURRENCY_COOKIE = "CURRENCY";
export const COUNTRY_COOKIE = "COUNTRY";

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export {
  REGION_PRESETS,
  REGION_CONFIRMED_KEY,
  findPresetByCountry,
  resolveActivePreset,
  getCookieValue,
  type RegionPreset,
  type RegionGroup,
} from "./regions";

export function suggestFromCountry(country?: string | null): {
  locale: Locale;
  country: string;
} {
  if (!country) return { locale: DEFAULT_LOCALE, country: "US" };
  const code = country.toUpperCase();
  const mapped = COUNTRY_MAPPING[code];
  return {
    locale: mapped?.locale ?? DEFAULT_LOCALE,
    country: code,
  };
}
