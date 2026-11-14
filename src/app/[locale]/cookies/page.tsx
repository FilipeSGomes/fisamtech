import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { InstitutionalShell } from "@/components/layout/InstitutionalShell";
import { pageMetadata } from "@/lib/seo";

type CookieRow = { name: string; duration: string; purpose: string; kind: string };
type Block = { title: string; paragraphs: string[] };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return pageMetadata(locale, `${t("cookiesTitle")} | FISAM TECH`, t("cookiesLead"), "/cookies");
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const rows = t.raw("cookieRows") as CookieRow[];
  const blocks = t.raw("cookieBlocks") as Block[];

  return (
    <InstitutionalShell
      prose
      eyebrow={t("eyebrow")}
      title={t("cookiesTitle")}
      lead={t("cookiesLead")}
    >
        <table className="cookie-table">
          <thead>
            <tr>
              <th>{t("cookieName")}</th>
              <th>{t("cookieDuration")}</th>
              <th>{t("cookieKind")}</th>
              <th>{t("cookiePurpose")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.duration}</td>
                <td>{row.kind}</td>
                <td>{row.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
