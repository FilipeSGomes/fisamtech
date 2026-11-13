"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { BUDGET_RANGES } from "@/lib/config";
import { Link } from "@/i18n/routing";
import { track } from "@/lib/analytics";

function formatBudgetBrl(range: (typeof BUDGET_RANGES)[number]): string {
  const fmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
  const min = fmt.format(range.min).replace(/\u00a0/g, " ");
  if (range.max == null) return `${min}+`;
  const max = fmt.format(range.max).replace(/\u00a0/g, " ");
  return `${min} a ${max}`;
}

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
    const country = getCookie("COUNTRY") || "BR";

    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      company: String(fd.get("company") || ""),
      country,
      role: String(fd.get("role") || ""),
      challenge: String(fd.get("challenge") || ""),
      budget_range: String(fd.get("budget") || ""),
      currency: "BRL",
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

      const unlockRes = await fetch("/api/booking/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: data.id, free: true }),
      });
      const unlock = await unlockRes.json();
      if (!unlockRes.ok || !unlock.token) {
        throw new Error(unlock.error || "Booking unlock failed");
      }

      track("booking_unlocked", { leadId: data.id, free: true });
      router.push(`/book?token=${encodeURIComponent(unlock.token)}`);
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
        <select name="budget" required defaultValue="">
          <option value="" disabled>
            {t("budgetPlaceholder")}
          </option>
          {BUDGET_RANGES.map((range) => (
            <option key={range.id} value={range.id}>
              {formatBudgetBrl(range)}
            </option>
          ))}
        </select>
      </label>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        {t("priceNote")}
      </p>
      <p className="muted" style={{ fontSize: "0.9rem" }}>
        {t("privacyBefore")}{" "}
        <Link href="/privacy">{t("privacyLink")}</Link>
        {t("privacyAfter")}
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
