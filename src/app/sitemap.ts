import type { MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "@/lib/config";
import { SITE, languageAlternates } from "@/lib/seo";

const site = process.env.NEXT_PUBLIC_SITE_URL || SITE;

const paths = [
  "",
  "/cases",
  "/qualify",
  "/parceiros",
  "/partners",
  "/privacy",
  "/terms",
  "/cookies",
  "/compliance",
  "/denuncia",
  "/chamados",
  "/services/systems-architecture",
  "/services/backend-engineering",
  "/services/critical-integrations",
  "/services/legacy-modernization",
  "/services/genai-governance",
  "/services/public-procurement",
  "/services/proof-of-concept",
  "/services/systems-development",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of SUPPORTED_LANGUAGES) {
    for (const path of paths) {
      entries.push({
        url: `${site}/${locale}${path}`,
        lastModified: new Date(),
        alternates: {
          languages: languageAlternates(path, site),
        },
      });
    }
  }
  return entries;
}
