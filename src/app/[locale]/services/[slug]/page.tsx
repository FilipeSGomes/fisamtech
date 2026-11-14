import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstitutionalShell } from "@/components/layout/InstitutionalShell";
import { Link } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";

const SLUGS = [
  "systems-architecture",
  "backend-engineering",
  "critical-integrations",
  "legacy-modernization",
  "genai-governance",
  "public-procurement",
  "proof-of-concept",
  "systems-development",
] as const;

const SLUG_TO_KEY: Record<(typeof SLUGS)[number], string> = {
  "systems-architecture": "architecture",
  "backend-engineering": "backend",
  "critical-integrations": "integrations",
  "legacy-modernization": "legacy",
  "genai-governance": "genai",
  "public-procurement": "procurement",
  "proof-of-concept": "poc",
  "systems-development": "systems",
};

const PAGE_PARTS = ["problem", "audience", "deliver"] as const;

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
    <InstitutionalShell
      prose
      eyebrow={t("eyebrow")}
      title={t(`${key}.title`)}
      lead={t(`${key}.body`)}
      cta={{ href: "/qualify", label: t(`${key}.page.cta`) }}
    >
      {PAGE_PARTS.map((part) => (
        <div key={part}>
          <h2>{t(`pageLabels.${part}`)}</h2>
          <p>{t(`${key}.page.${part}`)}</p>
        </div>
      ))}
      {slug === "public-procurement" ? (
        <p>
          <Link href="/compliance">{t("procurement.complianceLink")}</Link>
        </p>
      ) : null}
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
    </InstitutionalShell>
  );
}
