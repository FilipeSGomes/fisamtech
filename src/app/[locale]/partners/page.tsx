import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";

export { default } from "../parceiros/page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "partners" });
  return pageMetadata(
    locale,
    `${t("metaTitle")} | FISAM TECH`,
    t("metaDescription"),
    "/partners"
  );
}
