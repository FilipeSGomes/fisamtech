import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { isLocale, type Locale } from "@/lib/config";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !isLocale(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

export type Messages = typeof import("../messages/en.json");

export function assertLocale(locale: string): Locale {
  if (!isLocale(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  return locale;
}
