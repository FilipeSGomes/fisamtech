import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { ArchitectureVisual } from "@/components/layout/ArchitectureVisual";
import { CinematicStage } from "@/components/layout/CinematicStage";
import { EnergyField } from "@/components/layout/EnergyField";
import { Link } from "@/i18n/routing";
import {
  FOUNDER_PRIOR_EXPERIENCE,
  FISAM_CLIENTS,
  PRODUCTS,
  WHATSAPP,
} from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

const SERVICE_KEYS = [
  "architecture",
  "backend",
  "integrations",
  "legacy",
  "genai",
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata(locale, t("title"), t("description"), "/");
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const isBr = locale === "pt-br";

  return (
    <div className="home-page">
      <CinematicStage />
      <section className="hero">
        <EnergyField />
        <span className="hero-glow" aria-hidden="true" />
        <div className="shell hero-grid">
          <div className="hero-copy">
          <p className="eyebrow">{t("hero.eyebrow")}</p>
          <h1>{t("hero.title")}</h1>
          <p className="lead">{t("hero.lead")}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/qualify">
              {t("hero.ctaPrimary")}
            </Link>
            {isBr ? (
              <a
                className="btn btn-ghost"
                href={`${WHATSAPP.url}?text=${encodeURIComponent(t("hero.whatsappPrefill"))}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("hero.ctaSecondary")}
              </a>
            ) : (
              <a className="btn btn-ghost" href="mailto:contato@fisamtech.com">
                {t("hero.ctaSecondary")}
              </a>
            )}
            <Link className="btn btn-ghost" href="/cases">
              {t("hero.ctaWork")}
            </Link>
          </div>
          <div className="hero-footnote"><span className="hero-line" /> {t("hero.footnote")}</div>
          </div>
          <ArchitectureVisual labels={{ title: t("hero.visual.title"), applications: t("hero.visual.applications"), apis: t("hero.visual.apis"), data: t("hero.visual.data"), operations: t("hero.visual.operations"), caption: t("hero.visual.caption"), hint: t("hero.visual.hint"), descriptions: { applications: t("hero.visual.descriptions.applications"), apis: t("hero.visual.descriptions.apis"), data: t("hero.visual.descriptions.data"), operations: t("hero.visual.descriptions.operations") } }} />
        </div>
        <div className="shell hero-bottom"><span>{t("credentials.focusValue")}</span><a href="#process">{t("hero.scroll")} <span aria-hidden="true">↓</span></a></div>
      </section>

      <section id="credentials" className="section section--dark credentials-section" data-cine="rise">
        <div className="shell">
          <p className="eyebrow">{t("credentials.eyebrow")}</p>
          <h2>{t("credentials.title")}</h2>
          <p className="lead">{t("credentials.lead")}</p>
          <div className="grid-2 credential-grid">
            <div>
              <span className="muted">{t("credentials.exp")}</span>
              <span className="stat-value">{t("credentials.expValue")}</span>
            </div>
            <div>
              <span className="muted">{t("credentials.market")}</span>
              <span className="stat-value">{t("credentials.marketValue")}</span>
            </div>
            <div>
              <span className="muted">{t("credentials.focus")}</span>
              <span className="stat-value">{t("credentials.focusValue")}</span>
            </div>
            <div>
              <span className="muted">{t("credentials.method")}</span>
              <span className="stat-value">{t("credentials.methodValue")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--light problems-section" data-cine="rise">
        <div className="shell">
          <p className="eyebrow">{t("problems.eyebrow")}</p>
          <h2>{t("problems.title")}</h2>
          <p className="lead">{t("problems.lead")}</p>
          <div className="grid-2">
            {(["scale", "integrations", "legacy", "genai"] as const).map((k, index) => (
              <article key={k} className="card problem-card">
                <span className="card-index">0{index + 1}</span>
                <h3>{t(`problems.items.${k}.title`)}</h3>
                <p style={{ marginTop: 8 }}>{t(`problems.items.${k}.body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="section" data-cine="rise">
        <div className="shell">
          <p className="eyebrow">{t("services.eyebrow")}</p>
          <h2>{t("services.title")}</h2>
          <p className="lead">{t("services.lead")}</p>
          <div className="grid-3">
            {SERVICE_KEYS.map((k, index) => (
              <article key={k} className={`card service-card service-card--${k}`}>
                <span className="card-index">0{index + 1}</span>
                <h3>{t(`services.${k}.title`)}</h3>
                <p style={{ marginTop: 8 }}>{t(`services.${k}.body`)}</p>
                <Link href={`/services/${t(`services.${k}.slug`)}`}>
                  {t("common.learnMore")}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--light cases-section" data-cine="rise">
        <div className="shell">
          <p className="eyebrow">{t("casesHome.eyebrow")}</p>
          <h2>{t("casesHome.title")}</h2>
          <p className="lead">{t("casesHome.lede")}</p>
          <div className="grid-2">
            {FISAM_CLIENTS.map((c) => (
              <article key={c} className="card">
                <h3>{c}</h3>
                <p className="muted" style={{ marginTop: 6 }}>
                  {t("casesHome.clientLabel")}
                </p>
              </article>
            ))}
            {PRODUCTS.slice(0, 2).map((p) => (
              <article key={p.name} className="card">
                <h3>{p.name}</h3>
                <p className="muted" style={{ marginTop: 6 }}>
                  {t("casesHome.productLabel")}
                </p>
                <a href={p.url} target="_blank" rel="noreferrer">
                  {p.url.replace("https://", "")}
                </a>
              </article>
            ))}
          </div>
          <p style={{ marginTop: 20 }}>
            <Link href="/cases">{t("casesHome.link")}</Link>
          </p>
        </div>
      </section>

      <section id="process" className="section process-section" data-cine="rise">
        <div className="shell">
          <p className="eyebrow">{t("howWeWork.eyebrow")}</p>
          <h2>{t("howWeWork.title")}</h2>
          <p className="lead">{t("howWeWork.lead")}</p>
          <div className="grid-2">
            {(["1", "2", "3", "4"] as const).map((n) => (
              <article key={n} className="card process-card">
                <p className="process-number">0{n}</p>
                <h3>{t(`howWeWork.steps.${n}.title`)}</h3>
                <p style={{ marginTop: 8 }}>{t(`howWeWork.steps.${n}.body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--light principles-section" data-cine="rise">
        <div className="shell">
          <p className="eyebrow">{t("why.eyebrow")}</p>
          <h2>{t("why.title")}</h2>
          <ul>
            {(["a", "b", "c"] as const).map((k) => (
              <li key={k} style={{ marginTop: 10 }}>
                {t(`why.items.${k}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section founder-section" data-cine="rise">
        <div className="shell founder">
          <div>
            <picture>
              <source srcSet="/images/filipefundador.webp" type="image/webp" />
              <img
                src="/images/filipefundador.png"
                alt={t("founder.alt")}
                width={760}
                height={950}
                loading="lazy"
              />
            </picture>
          </div>
          <div>
            <h2>{t("founder.title")}</h2>
            <p style={{ marginTop: 14 }}>{t("founder.body1")}</p>
            <p style={{ marginTop: 14 }}>{t("founder.body2")}</p>
            <p className="muted" style={{ marginTop: 16 }}>
              {t("founder.prior")}
            </p>
            <p className="muted" style={{ marginTop: 8, fontSize: "0.9rem" }}>
              {FOUNDER_PRIOR_EXPERIENCE.join(" · ")}
            </p>
          </div>
        </div>
      </section>

      <section id="discovery" className="section section--dark discovery-section" data-cine="rise">
        <div className="shell">
          <p className="eyebrow">{t("discovery.eyebrow")}</p>
          <h2>{t("discovery.title")}</h2>
          <p className="lead">{t("discovery.lead")}</p>
          <ul style={{ marginTop: 20 }}>
            {(["1", "2", "3", "4"] as const).map((n) => (
              <li key={n}>{t(`discovery.includes.${n}`)}</li>
            ))}
          </ul>
          <p style={{ marginTop: 20, fontSize: "1.4rem", fontWeight: 600 }}>
            {t("discovery.priceLabel")}
          </p>
          <p className="muted" style={{ marginTop: 8 }}>
            {t("discovery.priceNote")}
          </p>
          <p style={{ marginTop: 24 }}>
            <Link className="btn btn-primary" href="/qualify">
              {t("discovery.cta")}
            </Link>
          </p>
        </div>
      </section>

      <section className="section section--light faq-section" data-cine="rise">
        <div className="shell faq">
          <p className="eyebrow">{t("faq.eyebrow")}</p>
          <h2>{t("faq.title")}</h2>
          {(["1", "2", "3", "4", "5"] as const).map((n) => (
            <details key={n}>
              <summary>{t(`faq.items.${n}.q`)}</summary>
              <p style={{ marginTop: 8 }}>{t(`faq.items.${n}.a`)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section section--dark closing-section" data-cine="rise">
        <div className="shell">
          <h2>{t("cta.title")}</h2>
          <p className="lead">{t("cta.lead")}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/qualify">
              {t("cta.primary")}
            </Link>
            {isBr ? (
              <a
                className="btn btn-ghost"
                href={WHATSAPP.url}
                target="_blank"
                rel="noreferrer"
              >
                {t("cta.secondary")}
              </a>
            ) : (
              <a className="btn btn-ghost" href="mailto:contato@fisamtech.com">
                {t("cta.secondary")}
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
