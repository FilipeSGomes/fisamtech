import type { Metadata } from "next";

export const SITE = "https://www.fisamtech.com";

const HREFLANG: Record<string, string> = {
  en: "en",
  "pt-br": "pt-BR",
  "pt-pt": "pt-PT",
  es: "es",
  fr: "fr",
  de: "de",
};

function normalizedSuffix(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return suffix === "/" ? "" : suffix;
}

/** hreflang map for one path, including x-default on the English URL. */
export function languageAlternates(
  path: string,
  site: string = SITE
): Record<string, string> {
  const suffix = normalizedSuffix(path);
  const languages = Object.fromEntries(
    Object.entries(HREFLANG).map(([code, href]) => [
      href,
      `${site}/${code}${suffix}`,
    ])
  );
  languages["x-default"] = `${site}/en${suffix}`;
  return languages;
}

export function pageMetadata(
  locale: string,
  title: string,
  description: string,
  path: string
): Metadata {
  const canonical = `${SITE}/${locale}${normalizedSuffix(path)}`;
  const languages = languageAlternates(path);
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
