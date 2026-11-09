import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { CONTACT } from "@/lib/config";

const SECTION_KEYS = [
  "code",
  "anticorruption",
  "conflict",
  "publicSector",
  "gifts",
  "privacy",
  "channel",
  "governance",
] as const;

export default async function CompliancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("compliance");

  return (
    <section className="section">
      <div className="shell legal-prose">
        <h1>{t("title")}</h1>
        <p className="lead">{t("lead")}</p>
        <p>
          <strong>{t("effective")}</strong>
        </p>
        <p>{t("companyLine", { company: CONTACT.company, cnpj: CONTACT.cnpj })}</p>

        {SECTION_KEYS.map((key) => (
          <div key={key}>
            <h2>{t(`sections.${key}.title`)}</h2>
            <p>{t(`sections.${key}.body`)}</p>
            {key === "privacy" && (
              <p>
                <Link href="/privacy">{t("privacyLink")}</Link>
              </p>
            )}
            {key === "channel" && (
              <p>
                <Link href="/denuncia">{t("channelLink")}</Link>
              </p>
            )}
          </div>
        ))}

        <h2>{t("responsibleTitle")}</h2>
        <p>{t("responsibleBody", { email: CONTACT.email })}</p>
      </div>
    </section>
  );
}
