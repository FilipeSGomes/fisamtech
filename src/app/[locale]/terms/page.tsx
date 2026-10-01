import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function TermsPage({
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
        <h1>{t("termsTitle")}</h1>
        <p className="lead">{t("termsLead")}</p>
        <h2>Website</h2>
        <p>
          Content is provided for information. No invented clients, metrics, or
          certifications are claimed.
        </p>
        <h2>Technical Discovery</h2>
        <p>
          Paid engagement. Calendar booking unlocks after payment confirmation
          via webhook. Refund and jurisdiction rules for international sales will
          be finalized with legal counsel — placeholders only until then.
        </p>
        <h2>Brazilian forum</h2>
        <p>
          For Brazilian consumers and the BR site experience, forum remains Embu
          das Artes / Embu-Guaçu region as historically stated, pending intl
          counsel update.
        </p>
      </div>
    </section>
  );
}
