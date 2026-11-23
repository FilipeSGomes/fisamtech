import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { SupportPortalClient } from "@/components/support/SupportPortalClient";
import { InstitutionalShell } from "@/components/layout/InstitutionalShell";
import { pageMetadata } from "@/lib/seo";
import { CONTACT, WHATSAPP } from "@/lib/config";

const STATUS_KEYS = [
  "open",
  "in_progress",
  "awaiting_client",
  "resolved",
  "closed",
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "supportTickets" });
  return pageMetadata(locale, `${t("title")} | FISAM TECH`, t("lead"), "/chamados");
}

export default async function ChamadosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("supportTickets");

  return (
    <InstitutionalShell prose eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <div className="support-info-grid">
        <p>{t("availability")}</p>
        <ul className="support-channel-list">
          <li>
            {t("channelWeb")}: <strong>fisamtech.com/chamados</strong>
          </li>
          <li>
            {t("channelPhone")}:{" "}
            <a href={`tel:+${WHATSAPP.e164}`}>{WHATSAPP.display}</a>
          </li>
          <li>
            {t("channelEmail")}:{" "}
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </li>
        </ul>
      </div>

      <h2>{t("statusOverviewTitle")}</h2>
      <ul className="support-status-legend">
        {STATUS_KEYS.map((key) => (
          <li key={key}>
            <strong>{t(`statuses.${key}`)}</strong>
            <span className="muted"> · {t(`statusHelp.${key}`)}</span>
          </li>
        ))}
      </ul>
      <p className="support-closure-note">{t("closurePolicy")}</p>

      <h2>{t("portalTitle")}</h2>
      <SupportPortalClient />
    </InstitutionalShell>
  );
}