import type { MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "@/lib/config";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://fisamtech.com";

const paths = [
  "",
  "/cases",
  "/qualify",
  "/parceiros",
  "/partners",
  "/privacy",
  "/terms",
  "/cookies",
  "/services/systems-architecture",
  "/services/backend-engineering",
  "/services/critical-integrations",
  "/services/legacy-modernization",
  "/services/genai-governance",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of SUPPORTED_LANGUAGES) {
    for (const path of paths) {
      entries.push({
        url: `${site}/${locale}${path}`,
        lastModified: new Date(),
        alternates: {
          languages: Object.fromEntries(
            SUPPORTED_LANGUAGES.map((l) => [l, `${site}/${l}${path}`])
          ),
        },
      });
    }
  }
  return entries;
}
