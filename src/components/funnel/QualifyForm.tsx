"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { SUPPORTED_CURRENCIES, type Currency } from "@fisamtech/payments";
import { track } from "@/lib/analytics";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

export function QualifyForm() {
  const t = useTranslations("qualification");
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    track("qualification_submitted");

    const fd = new FormData(e.currentTarget);
    const currency = (fd.get("currency") as Currency) || "USD";
    const country =
      getCookie("COUNTRY") ||
      (currency === "BRL"
        ? "BR"
        : currency === "ARS"
          ? "AR"
          : currency === "MXN"
            ? "MX"
            : currency === "COP"
              ? "CO"
              : currency === "CLP"
                ? "CL"
                : currency === "PEN"
                  ? "PE"
                  : currency === "UYU"
                    ? "UY"
                    : currency === "GBP"
                      ? "GB"
                      : currency === "EUR"
                        ? "DE"
                        : "US");

    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      company: String(fd.get("company") || ""),
      country,
      role: String(fd.get("role") || ""),
      challenge: String(fd.get("challenge") || ""),
      budget_range: String(fd.get("budget") || ""),
      currency,
      locale,
      source: "qualification",
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lead failed");
      track("checkout_started", { leadId: data.id, currency, country });
      router.push(
        `/checkout?leadId=${encodeURIComponent(data.id)}&currency=${currency}&country=${country}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label>
        {t("name")}
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        {t("email")}
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        {t("company")}
        <input name="company" autoComplete="organization" />
      </label>
      <label>
        {t("role")}
        <input name="role" />
      </label>
      <label>
        {t("challenge")}
        <textarea name="challenge" required />
      </label>
      <label>
        {t("budget")}
        <input name="budget" />
      </label>
      <label>
        {t("currency")}
        <select name="currency" defaultValue={locale === "pt-br" ? "BRL" : "USD"}>
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        {t("privacy")}
      </p>
      {error && (
        <p role="alert" style={{ color: "#b00020" }}>
          {error}
        </p>
      )}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "…" : t("submit")}
      </button>
    </form>
  );
}
