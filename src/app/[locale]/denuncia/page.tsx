import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { WhistleblowingForm } from "@/components/compliance/WhistleblowingForm";
import { pageMetadata } from "@/lib/seo";
import { PendingNotice } from "@/components/legal/PendingNotice";

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
    <section className="section">
      <div className="shell legal-prose">
        <h1>{t("title")}</h1>
        <p className="lead">{t("lead")}</p>
        <PendingNotice />
        <h2>{t("scopeTitle")}</h2>
        <p>{t("scopeBody")}</p>
        <h2>{t("guaranteesTitle")}</h2>
        <p>{t("guaranteesBody")}</p>
        <h2>{t("howTitle")}</h2>
        <p>{t("howBody")}</p>
        <p>
          <Link href="/compliance">{t("complianceLink")}</Link>
          {" · "}
          <Link href="/privacy">{t("privacyLink")}</Link>
        </p>
        <h2>{t("formTitle")}</h2>
        <WhistleblowingForm />
      </div>
    </section>
  );
}
