import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { WhistleblowingForm } from "@/components/compliance/WhistleblowingForm";

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
