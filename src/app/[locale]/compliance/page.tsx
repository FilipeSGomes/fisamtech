import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { InstitutionalShell } from "@/components/layout/InstitutionalShell";
import { CONTACT } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

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

  const steps = [
    ...SECTION_KEYS.map((key) => ({
      key,
      title: t(`sections.${key}.title`),
      body: t(`sections.${key}.body`),
    })),
    {
      key: "security",
      title: t("securityTitle"),
      body: t("securityBody"),
    },
    {
      key: "responsible",
      title: t("responsibleTitle"),
      body: t("responsibleBody", { email: CONTACT.email }),
    },
  ];

  return (
    <InstitutionalShell
      prose
      eyebrow={t("eyebrow")}
      title={t("title")}
      lead={t("lead")}
    >
      <p>
        <strong>{t("effective")}</strong>
      </p>
      <p>{t("companyLine", { company: CONTACT.legalName, cnpj: CONTACT.cnpj })}</p>
      <ol className="institutional-steps">
        {steps.map((step, index) => (
          <li key={step.key}>
            <span className="step-index">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
              {step.key === "privacy" ? (
                <p>
                  <Link href="/privacy">{t("privacyLink")}</Link>
                </p>
              ) : null}
              {step.key === "channel" ? (
                <p>
                  <Link href="/denuncia">{t("channelLink")}</Link>
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </InstitutionalShell>
  );
}
