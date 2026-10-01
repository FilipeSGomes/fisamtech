import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function PrivacyPage({
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
        <h1>{t("privacyTitle")}</h1>
        <p className="lead">{t("privacyLead")}</p>
        <h2>Controller</h2>
        <p>FISAM TECH — contato@fisamtech.com — CNPJ 60.870.695/0001-06.</p>
        <h2>Data we process</h2>
        <p>
          Qualification and partner forms: name, email, company, country, role,
          challenge description, and payment metadata. Preference cookies for
          locale and currency.
        </p>
        <h2>Purposes</h2>
        <p>
          Prepare Technical Discovery sessions, process payments via Stripe or
          Mercado Pago, unlock calendar booking, and operate the site.
        </p>
        <h2>International transfers & rights</h2>
        <p>
          Structure is prepared for LGPD and GDPR-style access/erasure requests.
          This page is not a certification of GDPR/UK GDPR/ePrivacy compliance —
          legal review is pending before public EU marketing claims.
        </p>
        <h2>Contact</h2>
        <p>Privacy requests: contato@fisamtech.com</p>
      </div>
    </section>
  );
}
