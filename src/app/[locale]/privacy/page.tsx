import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { InstitutionalShell } from "@/components/layout/InstitutionalShell";
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
    <InstitutionalShell
      prose
      eyebrow={t("eyebrow")}
      title={t("privacyTitle")}
      lead={t("privacyLead")}
    >
      <p>
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
    </InstitutionalShell>
  );
}
