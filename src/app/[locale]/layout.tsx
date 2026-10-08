import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { AnalyticsListener } from "@/components/layout/AnalyticsListener";
import { GeoSuggestionBanner } from "@/components/layout/GeoSuggestionBanner";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <a className="skip-link" href="#content">
            Skip
          </a>
          <SiteHeader locale={locale} />
          <main id="content">{children}</main>
          <SiteFooter locale={locale} />
          <GeoSuggestionBanner />
          <CookieBanner />
          <AnalyticsListener />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
