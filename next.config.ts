import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@fisamtech/payments"],
  // Keep letterhead available to serverless PDF generation.
  outputFileTracingIncludes: {
    "/api/admin/proposals/**": ["./private/branding/**"],
    "/api/admin/ndas/**": ["./private/branding/**"],
  },
  async redirects() {
    return [
      {
        source: "/cases.html",
        destination: "/pt-br/cases",
        permanent: true,
      },
      {
        source: "/parceiros",
        destination: "/pt-br/parceiros",
        permanent: true,
      },
      {
        source: "/parceiros/",
        destination: "/pt-br/parceiros",
        permanent: true,
      },
      {
        source: "/privacidade.html",
        destination: "/pt-br/privacy",
        permanent: true,
      },
      {
        source: "/termos.html",
        destination: "/pt-br/terms",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
