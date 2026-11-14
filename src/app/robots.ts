import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || SITE;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/*/super-admin", "/api/admin"],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
