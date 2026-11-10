import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { CONTACT } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";
import { PendingNotice } from "@/components/legal/PendingNotice";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "compliance" });
  return pageMetadata(locale, `${t("title")} | FISAM TECH`, t("lead"), "/compliance");
}

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
        <PendingNotice />
        <p>
          <strong>{t("effective")}</strong>
        </p>
        <p>{t("companyLine", { company: CONTACT.legalName, cnpj: CONTACT.cnpj })}</p>

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

        <h2>{t("securityTitle")}</h2>
        <p>{t("securityBody")}</p>

        <h2>{t("responsibleTitle")}</h2>
        <p>{t("responsibleBody", { email: CONTACT.email })}</p>
      </div>
    </section>
  );
}
