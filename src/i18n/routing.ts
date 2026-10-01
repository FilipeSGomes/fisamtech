import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";
import { SUPPORTED_LANGUAGES, DEFAULT_LOCALE } from "@/lib/config";

export const routing = defineRouting({
  locales: [...SUPPORTED_LANGUAGES],
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
