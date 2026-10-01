import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { CheckoutClient } from "@/components/funnel/CheckoutClient";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<p className="shell" style={{ padding: 48 }}>…</p>}>
      <CheckoutClient />
    </Suspense>
  );
}
