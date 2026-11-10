import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { QualifyForm } from "@/components/funnel/QualifyForm";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "qualification" });
  return pageMetadata(locale, `${t("metaTitle")} | FISAM TECH`, t("metaDescription"), "/qualify");
}

export default async function QualifyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("qualification");

  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p className="lead">{t("lead")}</p>
        <QualifyForm />
      </div>
    </section>
  );
}
