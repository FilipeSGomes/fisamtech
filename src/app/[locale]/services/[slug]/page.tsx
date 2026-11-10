import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

const SLUGS = [
  "systems-architecture",
  "backend-engineering",
  "critical-integrations",
  "legacy-modernization",
  "genai-governance",
] as const;

const SLUG_TO_KEY: Record<(typeof SLUGS)[number], string> = {
  "systems-architecture": "architecture",
  "backend-engineering": "backend",
  "critical-integrations": "integrations",
  "legacy-modernization": "legacy",
  "genai-governance": "genai",
};

const PAGE_PARTS = ["problem", "audience", "deliver", "method", "evidence"] as const;

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!SLUGS.includes(slug as (typeof SLUGS)[number])) return {};
  const key = SLUG_TO_KEY[slug as (typeof SLUGS)[number]];
  const t = await getTranslations({ locale, namespace: "services" });
  return pageMetadata(
    locale,
    `${t(`${key}.title`)} | FISAM TECH`,
    t(`${key}.page.problem`),
    `/services/${slug}`
  );
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!SLUGS.includes(slug as (typeof SLUGS)[number])) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("services");
  const key = SLUG_TO_KEY[slug as (typeof SLUGS)[number]];

  return (
    <section className="section inner-page">
      <div className="shell legal-prose">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t(`${key}.title`)}</h1>
        <p className="lead">{t(`${key}.body`)}</p>
        {PAGE_PARTS.map((part) => (
          <div key={part}>
            <h2>{t(`pageLabels.${part}`)}</h2>
            <p>{t(`${key}.page.${part}`)}</p>
          </div>
        ))}
        <p style={{ marginTop: 28 }}>
          <Link className="btn btn-primary" href="/qualify">
            {t(`${key}.page.cta`)}
          </Link>
        </p>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              name: t(`${key}.title`),
              description: t(`${key}.page.problem`),
              provider: {
                "@type": "Organization",
                name: "FISAM TECH TECNOLOGIA LTDA",
                url: "https://www.fisamtech.com",
              },
            }),
          }}
        />
      </div>
    </section>
  );
}
