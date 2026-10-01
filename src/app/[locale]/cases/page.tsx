import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import {
  FOUNDER_PRIOR_EXPERIENCE,
  FISAM_CLIENTS,
  PRODUCTS,
} from "@/lib/config";
import { Link } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cases" });
  return { title: `${t("title")} | FISAM TECH`, description: t("lead") };
}

export default async function CasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cases");

  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow">Evidence</p>
        <h1>{t("title")}</h1>
        <p className="lead">{t("lead")}</p>

        <h2 style={{ marginTop: 48 }}>{t("clientsTitle")}</h2>
        <div className="grid-2">
          <article className="card">
            <h3>{FISAM_CLIENTS[0]}</h3>
            <p className="muted">{t("sigabr.type")}</p>
            <p style={{ marginTop: 8 }}>{t("sigabr.body")}</p>
          </article>
          <article className="card">
            <h3>{FISAM_CLIENTS[1]}</h3>
            <p className="muted">{t("tennis.type")}</p>
            <p style={{ marginTop: 8 }}>{t("tennis.body")}</p>
          </article>
        </div>

        <h2 style={{ marginTop: 48 }}>{t("productsTitle")}</h2>
        <div className="grid-3">
          {PRODUCTS.map((p) => (
            <article key={p.name} className="card">
              <h3>{p.name}</h3>
              <a href={p.url} target="_blank" rel="noreferrer">
                {p.url.replace("https://", "")}
              </a>
            </article>
          ))}
        </div>
        <article className="card" style={{ marginTop: 20 }}>
          <h3>FISAM Quote</h3>
          <p className="muted">{t("quote.type")}</p>
          <p style={{ marginTop: 8 }}>{t("quote.body")}</p>
        </article>

        <h2 style={{ marginTop: 48 }}>{t("priorTitle")}</h2>
        <p className="lead">{t("priorLead")}</p>
        <p style={{ marginTop: 16 }}>{FOUNDER_PRIOR_EXPERIENCE.join(" · ")}</p>

        <p style={{ marginTop: 40 }}>
          <Link href="/qualify">Technical Discovery →</Link>
        </p>
      </div>
    </section>
  );
}
