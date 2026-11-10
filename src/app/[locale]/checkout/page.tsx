import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { CheckoutClient } from "@/components/funnel/CheckoutClient";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  return pageMetadata(locale, `${t("title")} | FISAM TECH`, t("metaDescription"), "/checkout");
}

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
