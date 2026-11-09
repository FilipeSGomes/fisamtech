import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";

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

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
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
    <section className="section">
      <div className="shell legal-prose">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t(`${key}.title`)}</h1>
        <p className="lead">{t(`${key}.body`)}</p>
        <p style={{ marginTop: 24 }}>
          <Link className="btn btn-primary" href="/qualify">
            Technical Discovery
          </Link>
        </p>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              name: t(`${key}.title`),
              description: t(`${key}.body`),
              provider: {
                "@type": "Organization",
                name: "FISAM TECH",
                url: "https://fisamtech.com",
              },
            }),
          }}
        />
      </div>
    </section>
  );
}
