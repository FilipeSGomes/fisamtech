"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FisamCheckout } from "@fisamtech/payments/client";
import type { CreatePaymentSessionResult, Currency } from "@fisamtech/payments";
import { isCommercialDiscoveryPrice } from "@fisamtech/payments/price";
import { Link, useRouter } from "@/i18n/routing";
import { track } from "@/lib/analytics";

export function CheckoutClient() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<CreatePaymentSessionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const leadId = params.get("leadId") || "";
  const currency = (params.get("currency") || "BRL") as Currency;
  const country = params.get("country") || "BR";
  const commercial = isCommercialDiscoveryPrice(currency);

  useEffect(() => {
    if (!leadId) {
      setError(t("missingLead"));
      setLoading(false);
      return;
    }
    if (!commercial) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/checkout/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, currency, country, locale }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t("error"));
        setSession(data.session);
        track("checkout_redirected", {
          provider: data.session?.provider,
          country,
          currency,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : t("error"));
      } finally {
        setLoading(false);
      }
    })();
  }, [leadId, currency, country, locale, t, commercial]);

  if (!commercial) {
    return (
      <div className="shell legal-prose" style={{ padding: "48px 0" }}>
        <h1>{t("error")}</h1>
        <p className="lead">{t("unpublished")}</p>
        <p style={{ marginTop: 20 }}>
          <Link className="btn btn-primary" href="/qualify">
            {t("backToQualify")}
          </Link>
        </p>
      </div>
    );
  }

  if (loading) return <p className="shell" style={{ padding: 48 }}>{t("title")}…</p>;
  if (error || !session) {
    return (
      <div className="shell legal-prose" style={{ padding: "48px 0" }}>
        <h1>{t("error")}</h1>
        <p role="alert">{error || t("configError")}</p>
        <p style={{ marginTop: 20 }}>
          <Link href="/qualify">{t("backToQualify")}</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="shell" style={{ padding: "48px 0" }}>
      <h1>{t("title")}</h1>
      <FisamCheckout
        session={session}
        serviceLabel={t("serviceLabel")}
        termsUrl={`/${locale}/terms`}
        privacyUrl={`/${locale}/privacy`}
        cancelPolicyUrl={`/${locale}/terms`}
        locale={locale}
        labels={{
          secure: t("secure"),
          terms: t("termsLink"),
          privacy: t("privacyLink"),
          cancel: t("cancelLink"),
          done: t("paidContinue"),
          loading: t("loading"),
          errorMissing: t("errorMissing"),
          errorHint: t("errorHint"),
        }}
        onComplete={() => {
          router.push(`/checkout/success?leadId=${encodeURIComponent(leadId)}`);
        }}
        onError={(msg) => setError(msg)}
      />
    </div>
  );
}
