import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { CONTACT } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

type Block = { title: string; paragraphs: string[] };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return pageMetadata(locale, `${t("privacyTitle")} | FISAM TECH`, t("privacyLead"), "/privacy");
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const blocks = t.raw("privacyBlocks") as Block[];

  return (
    <section className="section inner-page">
      <div className="shell legal-prose">
        <h1>{t("privacyTitle")}</h1>
        <p className="lead">{t("privacyLead")}</p>
        <p style={{ marginTop: 16 }}>
          {CONTACT.legalName}. CNPJ {CONTACT.cnpj}. {CONTACT.email}
        </p>
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
