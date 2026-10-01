import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function CheckoutPendingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  return (
    <section className="section">
      <div className="shell">
        <h1>{t("pending")}</h1>
        <p className="lead">{t("pendingLead")}</p>
      </div>
    </section>
  );
}
