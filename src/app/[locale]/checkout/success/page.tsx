import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { BookingUnlock } from "@/components/funnel/BookingUnlock";
import { getApprovedPaymentForLead } from "@/lib/db";
import { issueBookingToken } from "@/lib/booking/issue";
import { verifyBookingToken } from "@/lib/booking/token";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return pageMetadata(locale, `${t("success")} | FISAM TECH`, t("successPending"), "/checkout/success");
}

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

  let initialToken: string | undefined;
  if (sp.token && verifyBookingToken(sp.token)) {
    initialToken = sp.token;
  } else if (sp.leadId) {
    const payment = await getApprovedPaymentForLead(sp.leadId);
    if (payment) {
      initialToken = await issueBookingToken(sp.leadId, payment.id);
    }
  }

  return (
    <section className="section">
      <div className="shell legal-prose">
        <h1>{initialToken ? t("success") : t("successTitlePending")}</h1>
        <p className="lead">
          {initialToken ? t("successLead") : t("successPending")}
        </p>
        <BookingUnlock leadId={sp.leadId} initialToken={initialToken} />
      </div>
    </section>
  );
}
