import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import {
  CURRENCY_COOKIE,
  LOCALE_COOKIE,
  COUNTRY_COOKIE,
  suggestFromCountry,
  isLocale,
} from "./lib/config";
import { resolveRoute } from "@fisamtech/payments";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const countryHeader =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    null;

  const suggested = suggestFromCountry(countryHeader);
  const paymentRoute = resolveRoute(suggested.country);
  const localeCookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const currencyCookie = request.cookies.get(CURRENCY_COOKIE)?.value;
  const countryCookie = request.cookies.get(COUNTRY_COOKIE)?.value;

  if (pathname === "/") {
    const targetLocale =
      localeCookie && isLocale(localeCookie) ? localeCookie : suggested.locale;
    const url = request.nextUrl.clone();
    url.pathname = `/${targetLocale}`;
    const response = NextResponse.redirect(url);
    if (!currencyCookie) {
      response.cookies.set(CURRENCY_COOKIE, paymentRoute.currency, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    if (!countryCookie && countryHeader) {
      response.cookies.set(COUNTRY_COOKIE, suggested.country, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  }

  const response = intlMiddleware(request);

  if (!currencyCookie) {
    response.cookies.set(CURRENCY_COOKIE, paymentRoute.currency, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  if (!countryCookie && countryHeader) {
    response.cookies.set(COUNTRY_COOKIE, suggested.country, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  if (!localeCookie) {
    const segment = pathname.split("/")[1];
    if (segment && isLocale(segment)) {
      response.cookies.set(LOCALE_COOKIE, segment, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
  }

  return response;
}

export const config = {
  matcher: ["/", "/((?!_next|.*\\..*).*)"],
};
