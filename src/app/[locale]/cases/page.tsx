import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import {
  FOUNDER_PRIOR_EXPERIENCE,
  FISAM_CLIENTS,
  PRODUCTS,
} from "@/lib/config";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

const PRACTICES = ["bids", "poc", "systems"] as const;

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
  const clients = [
    { name: FISAM_CLIENTS[0], key: "sigabr" },
    { name: FISAM_CLIENTS[1], key: "tennis" },
  ] as const;

  return (
    <div className="cases-page">
      <section className="section section--dark cases-hero">
        <div className="shell">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p className="lead">{t("lead")}</p>
        </div>
      </section>

      <section className="section cases-practice">
        <div className="shell">
          <h2>{t("practiceTitle")}</h2>
          <p className="lead">{t("practiceLead")}</p>
          <div className="grid-3 cases-practice-grid">
            {PRACTICES.map((key, index) => (
              <article key={key} className="card cases-practice-card">
                <span className="card-index">0{index + 1}</span>
                <h3>{t(`practices.${key}.title`)}</h3>
                <p>{t(`practices.${key}.body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--light">
        <div className="shell">
          <h2>{t("clientsTitle")}</h2>
          <p className="lead">{t("limit")}</p>
          <div className="grid-2 cases-client-grid">
            {clients.map((client) => (
              <article key={client.key} className="card cases-client-card">
                <p className="muted">{t(`${client.key}.type`)}</p>
                <h3>{client.name}</h3>
                <p>{t(`${client.key}.situation`)}</p>
                <p>{t(`${client.key}.published`)}</p>
                <p className="muted">{t(`${client.key}.missing`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <h2>{t("productsTitle")}</h2>
          <p className="lead">{t("productsLead")}</p>
          <div className="grid-3 cases-product-grid">
            {PRODUCTS.map((product) => (
              <article key={product.name} className="card cases-product-card">
                <h3>{product.name}</h3>
                <a href={product.url} target="_blank" rel="noreferrer">
                  {product.url.replace("https://", "")}
                </a>
              </article>
            ))}
          </div>
          <p className="cases-note">{t("quote.body")}</p>
        </div>
      </section>

      <section className="section section--dark cases-prior">
        <div className="shell">
          <h2>{t("priorTitle")}</h2>
          <p className="lead">{t("priorLead")}</p>
          <ul className="cases-prior-list">
            {FOUNDER_PRIOR_EXPERIENCE.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          <Link className="btn btn-primary" href="/qualify">
            {t("cta")}
          </Link>
        </div>
      </section>
    </div>
  );
}
