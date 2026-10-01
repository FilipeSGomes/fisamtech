import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ leadId?: string; token?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");

  // Ask unlock API for booking token when leadId present
  let bookHref = "/book";
  if (sp.leadId) {
    try {
      const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const res = await fetch(`${base}/api/booking/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: sp.leadId, provisional: true }),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) bookHref = `/book?token=${encodeURIComponent(data.token)}`;
      }
    } catch {
      // webhook may unlock later — pending page path
    }
  }

  return (
    <section className="section">
      <div className="shell">
        <h1>{t("success")}</h1>
        <p className="lead">{t("successLead")}</p>
        <p style={{ marginTop: 24 }}>
          <Link className="btn btn-primary" href={bookHref}>
            {t("book")}
          </Link>
        </p>
        <p className="muted" style={{ marginTop: 16 }}>
          If payment is still confirming, you may see a pending state — booking
          unlocks after the signed webhook.
        </p>
      </div>
    </section>
  );
}
