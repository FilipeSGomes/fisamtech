import type { Metadata } from "next";

const SITE = "https://www.fisamtech.com";

const HREFLANG: Record<string, string> = {
  en: "en",
  "pt-br": "pt-BR",
  "pt-pt": "pt-PT",
  es: "es",
  fr: "fr",
  de: "de",
};

export function pageMetadata(
  locale: string,
  title: string,
  description: string,
  path: string
): Metadata {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const canonicalPath = `/${locale}${suffix === "/" ? "" : suffix}`;
  const canonical = `${SITE}${canonicalPath}`;
  const languages = Object.fromEntries(
    Object.entries(HREFLANG).map(([code, href]) => [
      href,
      `${SITE}/${code}${suffix === "/" ? "" : suffix}`,
    ])
  );
  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "FISAM TECH",
      locale: HREFLANG[locale] ?? locale,
    },
  };
}
