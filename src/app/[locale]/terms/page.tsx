import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PendingNotice } from "@/components/legal/PendingNotice";

type Block = { title: string; paragraphs: string[] };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return pageMetadata(locale, `${t("termsTitle")} | FISAM TECH`, t("termsLead"), "/terms");
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const blocks = t.raw("termsBlocks") as Block[];

  return (
    <section className="section inner-page">
      <div className="shell legal-prose">
        <h1>{t("termsTitle")}</h1>
        <p className="lead">{t("termsLead")}</p>
        <PendingNotice />
        {blocks.map((block) => (
          <div key={block.title}>
            <h2>{block.title}</h2>
            {block.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
