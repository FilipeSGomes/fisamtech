import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { PartnersForm } from "@/components/funnel/PartnersForm";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "partners" });
  return pageMetadata(locale, `${t("metaTitle")} | FISAM TECH`, t("metaDescription"), "/parceiros");
}

export default async function ParceirosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("partners");

  return (
    <section className="section inner-page">
      <div className="shell">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <div className="audience-note">
          <p>{t("notTheService")}</p>
          <p>
            <Link href="/qualify">{t("hireCta")}</Link>
          </p>
        </div>
        <p className="lead">{t("lead")}</p>
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
