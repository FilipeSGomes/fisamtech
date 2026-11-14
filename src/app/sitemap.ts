import type { MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "@/lib/config";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.fisamtech.com";

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
          languages: Object.fromEntries(
            SUPPORTED_LANGUAGES.map((l) => [l, `${site}/${l}${path}`])
          ),
        },
      });
    }
  }
  return entries;
}
