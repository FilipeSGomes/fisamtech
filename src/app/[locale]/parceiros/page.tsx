import { setRequestLocale, getTranslations } from "next-intl/server";
import { PartnersForm } from "@/components/funnel/PartnersForm";

export default async function ParceirosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("partners");
  const br = locale === "pt-br";

  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow">{br ? "Parceiros" : "Partners"}</p>
        <h1>{br ? t("brTitle") : t("title")}</h1>
        <p className="lead">{br ? t("brLead") : t("lead")}</p>
        <div className="grid-3">
          {(["1", "2", "3"] as const).map((n) => (
            <article key={n} className="card">
              <h3>{t(`step${n}.title`)}</h3>
              <p style={{ marginTop: 8 }}>{t(`step${n}.body`)}</p>
            </article>
          ))}
        </div>
        <PartnersForm />
      </div>
    </section>
  );
}
