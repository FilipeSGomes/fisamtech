import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { WhistleblowingForm } from "@/components/compliance/WhistleblowingForm";
import { InstitutionalShell } from "@/components/layout/InstitutionalShell";
import { pageMetadata } from "@/lib/seo";

const STEPS = [
  ["scope", "scopeTitle", "scopeBody"],
  ["guarantees", "guaranteesTitle", "guaranteesBody"],
  ["how", "howTitle", "howBody"],
  ["receipt", "receiptTitle", "receiptBody"],
  ["analysis", "analysisTitle", "analysisBody"],
  ["retention", "retentionTitle", "retentionBody"],
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "whistleblowing" });
  return pageMetadata(locale, `${t("title")} | FISAM TECH`, t("lead"), "/denuncia");
}

export default async function DenunciaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("whistleblowing");

  return (
    <InstitutionalShell prose eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <ol className="institutional-steps">
        {STEPS.map(([key, titleKey, bodyKey], index) => (
          <li key={key}>
            <span className="step-index">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>{t(titleKey)}</h2>
              <p>{t(bodyKey)}</p>
            </div>
          </li>
        ))}
      </ol>
      <p>
        <Link href="/compliance">{t("complianceLink")}</Link>
        {" · "}
        <Link href="/privacy">{t("privacyLink")}</Link>
      </p>
      <h2>{t("formTitle")}</h2>
      <WhistleblowingForm />
    </InstitutionalShell>
  );
}
