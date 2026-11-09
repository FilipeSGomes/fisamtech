import { setRequestLocale, getTranslations } from "next-intl/server";
import { QualifyForm } from "@/components/funnel/QualifyForm";

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
        <h1>{t("title")}</h1>
        <p className="lead">{t("lead")}</p>
        <QualifyForm />
      </div>
    </section>
  );
}
