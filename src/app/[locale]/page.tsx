import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import {
  FOUNDER_PRIOR_EXPERIENCE,
  FISAM_CLIENTS,
  PRODUCTS,
  WHATSAPP,
} from "@/lib/config";
import { formatMoney, getDiscoveryPrice } from "@fisamtech/payments";
import type { Currency } from "@fisamtech/payments";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        "pt-BR": "/pt-br",
        "pt-PT": "/pt-pt",
        es: "/es",
        fr: "/fr",
        de: "/de",
      },
    },
  };
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

  // Default display currency by locale suggestion
  const currencyByLocale: Record<string, Currency> = {
    "pt-br": "BRL",
    "pt-pt": "EUR",
    en: "USD",
    es: "EUR",
    fr: "EUR",
    de: "EUR",
  };
  const currency = currencyByLocale[locale] ?? "USD";
  const price = getDiscoveryPrice(currency);

  return (
    <>
      <section className="hero">
        <div className="shell">
          <p className="eyebrow">{t("hero.eyebrow")}</p>
          <h1>FISAM TECH</h1>
          <h2 style={{ marginTop: 12, fontWeight: 600 }}>{t("hero.title")}</h2>
          <p className="lead">{t("hero.lead")}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/qualify">
              {t("hero.ctaPrimary")}
            </Link>
            {isBr ? (
              <a
                className="btn btn-ghost"
                href={`${WHATSAPP.url}?text=${encodeURIComponent("Olá, quero conversar sobre um desafio técnico.")}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("hero.ctaSecondary")}
              </a>
            ) : (
              <a className="btn btn-ghost" href={`mailto:contato@fisamtech.com`}>
                {t("hero.ctaSecondary")}
              </a>
            )}
            <Link className="btn btn-ghost" href="/cases">
              {t("hero.ctaWork")}
            </Link>
          </div>
        </div>
      </section>

      <section id="process" className="section section--dark">
        <div className="shell">
          <p className="eyebrow">{t("credentials.eyebrow")}</p>
          <h2>{t("credentials.title")}</h2>
          <p className="lead">{t("credentials.lead")}</p>
          <div className="grid-2" style={{ marginTop: 36 }}>
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

      <section className="section section--light">
        <div className="shell">
          <p className="eyebrow">{t("problems.eyebrow")}</p>
          <h2>{t("problems.title")}</h2>
          <div className="grid-2">
            {(["scale", "integrations", "legacy", "genai"] as const).map((k) => (
              <article key={k} className="card">
                <h3>{t(`problems.items.${k}.title`)}</h3>
                <p style={{ marginTop: 8 }}>{t(`problems.items.${k}.body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="section">
        <div className="shell">
          <p className="eyebrow">{t("services.eyebrow")}</p>
          <h2>{t("services.title")}</h2>
          <div className="grid-3">
            {(
              [
                "architecture",
                "backend",
                "integrations",
                "legacy",
                "genai",
                "field",
              ] as const
            ).map((k) => (
              <article key={k} className="card">
                <h3>{t(`services.${k}.title`)}</h3>
                <p style={{ marginTop: 8 }}>{t(`services.${k}.body`)}</p>
                {k !== "field" && (
                  <Link
                    href={`/services/${t(`services.${k}.slug`)}`}
                    style={{ display: "inline-block", marginTop: 12 }}
                  >
                    {t("common.learnMore")}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--light">
        <div className="shell">
          <p className="eyebrow">{t("casesHome.eyebrow")}</p>
          <h2>{t("casesHome.title")}</h2>
          <p className="lead">{t("casesHome.lede")}</p>
          <div className="grid-2">
            {FISAM_CLIENTS.map((c) => (
              <article key={c} className="card">
                <h3>{c}</h3>
                <p className="muted" style={{ marginTop: 6 }}>
                  FISAM TECH client
                </p>
              </article>
            ))}
            {PRODUCTS.slice(0, 2).map((p) => (
              <article key={p.name} className="card">
                <h3>{p.name}</h3>
                <a href={p.url} target="_blank" rel="noreferrer">
                  {p.url.replace("https://", "")}
                </a>
              </article>
            ))}
          </div>
          <p style={{ marginTop: 20 }}>
            <Link href="/cases">{t("casesHome.link")} →</Link>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <p className="eyebrow">{t("howWeWork.eyebrow")}</p>
          <h2>{t("howWeWork.title")}</h2>
          <div className="grid-2">
            {(["1", "2", "3", "4"] as const).map((n) => (
              <article key={n} className="card">
                <p className="muted">{n}</p>
                <h3>{t(`howWeWork.steps.${n}.title`)}</h3>
                <p style={{ marginTop: 8 }}>{t(`howWeWork.steps.${n}.body`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--light">
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

      <section className="section">
        <div className="shell founder">
          <div>
            <picture>
              <source srcSet="/images/filipefundador.webp" type="image/webp" />
              <img
                src="/images/filipefundador.png"
                alt={t("founder.alt")}
                width={760}
                height={950}
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

      <section id="discovery" className="section section--dark">
        <div className="shell">
          <p className="eyebrow">{t("discovery.eyebrow")}</p>
          <h2>{t("discovery.title")}</h2>
          <p className="lead">{t("discovery.lead")}</p>
          <ul style={{ marginTop: 20 }}>
            {(["1", "2", "3"] as const).map((n) => (
              <li key={n}>{t(`discovery.includes.${n}`)}</li>
            ))}
          </ul>
          <p style={{ marginTop: 20, fontSize: "1.4rem", fontWeight: 600 }}>
            {t("discovery.from")} {formatMoney(price.amount, currency)}
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

      <section className="section section--light">
        <div className="shell faq">
          <p className="eyebrow">{t("faq.eyebrow")}</p>
          <h2>{t("faq.title")}</h2>
          {(["1", "2", "3", "4"] as const).map((n) => (
            <details key={n}>
              <summary>{t(`faq.items.${n}.q`)}</summary>
              <p style={{ marginTop: 8 }}>{t(`faq.items.${n}.a`)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section section--dark">
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
    </>
  );
}
