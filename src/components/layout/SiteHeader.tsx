"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import {
  LOCALE_LABELS,
  SUPPORTED_LANGUAGES,
  type Locale,
  CURRENCY_COOKIE,
  COUNTRY_COOKIE,
  LOCALE_COOKIE,
} from "@/lib/config";
import { SUPPORTED_CURRENCIES, type Currency } from "@fisamtech/payments";
import { track } from "@/lib/analytics";
import { WHATSAPP } from "@/lib/config";

export function SiteHeader({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const current = useLocale() as Locale;
  const isBr = current === "pt-br";

  function setLocale(next: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    track("locale_changed", { locale: next });
    router.replace(pathname, { locale: next });
  }

  function setCurrency(currency: Currency) {
    document.cookie = `${CURRENCY_COOKIE}=${currency};path=/;max-age=31536000;samesite=lax`;
    // Infer a representative country for that currency for checkout routing
    const currencyCountry: Partial<Record<Currency, string>> = {
      BRL: "BR",
      ARS: "AR",
      MXN: "MX",
      COP: "CO",
      CLP: "CL",
      PEN: "PE",
      UYU: "UY",
      USD: "US",
      EUR: "DE",
      GBP: "GB",
    };
    const country = currencyCountry[currency];
    if (country) {
      document.cookie = `${COUNTRY_COOKIE}=${country};path=/;max-age=31536000;samesite=lax`;
    }
    track("currency_changed", { currency });
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="FISAM TECH">
          <img src="/images/perfil-small.png" alt="" width={28} height={28} />
          <span>FISAM TECH</span>
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/#process">{t("process")}</Link>
          <Link href="/#services">{t("services")}</Link>
          <Link href="/cases">{t("cases")}</Link>
          {(isBr || current === "es") && (
            <Link href={isBr ? "/parceiros" : "/partners"}>{t("partners")}</Link>
          )}
          <Link href="/qualify">{t("discovery")}</Link>
          {isBr && (
            <a
              className="btn btn-primary"
              href={`${WHATSAPP.url}?text=${encodeURIComponent("Olá, quero conversar sobre um desafio técnico.")}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("whatsapp")}
            </a>
          )}
        </nav>
        <div className="locale-bar" aria-label="Language and currency">
          <label>
            <span className="visually-hidden">Language</span>
            <select
              value={current}
              onChange={(e) => setLocale(e.target.value as Locale)}
              aria-label="Language"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="visually-hidden">Currency</span>
            <select
              defaultValue={isBr ? "BRL" : "USD"}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              aria-label="Currency"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </header>
  );
}
