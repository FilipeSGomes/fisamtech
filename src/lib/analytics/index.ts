export type AnalyticsEventName =
  | "page_view"
  | "cta_clicked"
  | "locale_changed"
  | "currency_changed"
  | "qualification_started"
  | "qualification_submitted"
  | "checkout_started"
  | "checkout_redirected"
  | "payment_success"
  | "payment_pending"
  | "payment_failed"
  | "booking_unlocked"
  | "booking_opened"
  | "partners_started"
  | "partners_submitted"
  | "cookie_accepted"
  | "cookie_rejected";

export type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

type AnalyticsProvider = {
  track: (name: AnalyticsEventName, payload?: AnalyticsPayload) => void;
};

const consoleProvider: AnalyticsProvider = {
  track(name, payload) {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info("[analytics]", name, payload ?? {});
    }
    // Pluggable: push to dataLayer / Plausible / GA when configured
    if (typeof window !== "undefined") {
      const w = window as Window & {
        dataLayer?: Array<Record<string, unknown>>;
        plausible?: (event: string, opts?: { props?: AnalyticsPayload }) => void;
      };
      w.dataLayer?.push({ event: name, ...payload });
      w.plausible?.(name, { props: payload });
    }
  },
};

let provider: AnalyticsProvider = consoleProvider;

export function setAnalyticsProvider(next: AnalyticsProvider) {
  provider = next;
}

export function track(name: AnalyticsEventName, payload?: AnalyticsPayload) {
  try {
    provider.track(name, payload);
  } catch {
    // never break UX for analytics
  }
}

export function trackCta(label: string, href?: string) {
  track("cta_clicked", { label, href });
}
