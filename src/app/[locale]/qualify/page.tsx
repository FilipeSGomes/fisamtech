import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { QualifyForm } from "@/components/funnel/QualifyForm";
import { InstitutionalShell } from "@/components/layout/InstitutionalShell";
import { pageMetadata } from "@/lib/seo";

const DELIVERS = ["1", "2", "3", "4"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "qualification" });
  return pageMetadata(locale, `${t("metaTitle")} | FISAM TECH`, t("metaDescription"), "/qualify");
}

export default async function QualifyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("qualification");

  return (
    <InstitutionalShell
      bleed
      eyebrow={t("eyebrow")}
      title={t("title")}
      lead={t("lead")}
    >
      <section className="section qualify-section">
        <div className="shell qualify-layout">
          <div>
            <h2>{t("deliversTitle")}</h2>
            <ol className="qualify-points">
              {DELIVERS.map((n) => (
                <li key={n}>{t(`delivers.${n}`)}</li>
              ))}
            </ol>
          </div>
          <QualifyForm />
        </div>
      </section>
    </InstitutionalShell>
  );
}
