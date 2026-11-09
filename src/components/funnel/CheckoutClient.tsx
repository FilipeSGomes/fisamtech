"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FisamCheckout } from "@fisamtech/payments/client";
import type { CreatePaymentSessionResult } from "@fisamtech/payments";
import { useRouter } from "@/i18n/routing";
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
  const currency = params.get("currency") || "USD";
  const country = params.get("country") || "US";

  useEffect(() => {
    if (!leadId) {
      setError("Missing leadId");
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
  }, [leadId, currency, country, locale, t]);

  if (loading) return <p className="shell" style={{ padding: 48 }}>{t("title")}…</p>;
  if (error || !session) {
    return (
      <div className="shell" style={{ padding: 48 }}>
        <h1>{t("error")}</h1>
        <p>{error || t("configError")}</p>
      </div>
    );
  }

  return (
    <div className="shell" style={{ padding: "48px 0" }}>
      <h1>{t("title")}</h1>
      <FisamCheckout
        session={session}
        serviceLabel="Technical Discovery"
        termsUrl={`/${locale}/terms`}
        privacyUrl={`/${locale}/privacy`}
        cancelPolicyUrl={`/${locale}/terms`}
        locale={locale}
        onComplete={() => {
          router.push(`/checkout/success?leadId=${encodeURIComponent(leadId)}`);
        }}
        onError={(msg) => setError(msg)}
      />
    </div>
  );
}
