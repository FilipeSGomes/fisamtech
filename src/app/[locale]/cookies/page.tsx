import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  return (
    <section className="section">
      <div className="shell legal-prose">
        <h1>{t("cookiesTitle")}</h1>
        <p className="lead">{t("cookiesLead")}</p>
        <h2>Necessary</h2>
        <p>NEXT_LOCALE, CURRENCY, COUNTRY — language and payment routing preferences.</p>
        <h2>Optional analytics</h2>
        <p>
          Disabled until consent. No marketing cookies by default. CMP may be
          upgraded later without false compliance claims.
        </p>
      </div>
    </section>
  );
}
