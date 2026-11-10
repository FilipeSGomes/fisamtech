import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import {
  FOUNDER_PRIOR_EXPERIENCE,
  FISAM_CLIENTS,
  PRODUCTS,
} from "@/lib/config";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cases" });
  return pageMetadata(locale, `${t("title")} | FISAM TECH`, t("lead"), "/cases");
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
    <section className="section inner-page">
      <div className="shell legal-prose">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p className="lead">{t("lead")}</p>
        <p style={{ marginTop: 16 }}>{t("limit")}</p>

        <h2 style={{ marginTop: 48 }}>{t("clientsTitle")}</h2>
        <article className="card" style={{ marginTop: 16 }}>
          <h3>{FISAM_CLIENTS[0]}</h3>
          <p className="muted">{t("sigabr.type")}</p>
          <p style={{ marginTop: 8 }}>{t("sigabr.situation")}</p>
          <p style={{ marginTop: 8 }}>{t("sigabr.published")}</p>
          <p className="muted" style={{ marginTop: 8 }}>{t("sigabr.missing")}</p>
        </article>
        <article className="card" style={{ marginTop: 16 }}>
          <h3>{FISAM_CLIENTS[1]}</h3>
          <p className="muted">{t("tennis.type")}</p>
          <p style={{ marginTop: 8 }}>{t("tennis.situation")}</p>
          <p style={{ marginTop: 8 }}>{t("tennis.published")}</p>
          <p className="muted" style={{ marginTop: 8 }}>{t("tennis.missing")}</p>
        </article>

        <h2 style={{ marginTop: 48 }}>{t("productsTitle")}</h2>
        <p className="lead">{t("productsLead")}</p>
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
        <p style={{ marginTop: 12 }}>{t("quote.body")}</p>

        <h2 style={{ marginTop: 48 }}>{t("priorTitle")}</h2>
        <p className="lead">{t("priorLead")}</p>
        <p style={{ marginTop: 16 }}>{FOUNDER_PRIOR_EXPERIENCE.join(" · ")}</p>

        <p style={{ marginTop: 40 }}>
          <Link className="btn btn-primary" href="/qualify">
            {t("cta")}
          </Link>
        </p>
      </div>
    </section>
  );
}
