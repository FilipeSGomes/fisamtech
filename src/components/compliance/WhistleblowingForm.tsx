"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

const CATEGORIES = [
  "corruption",
  "fraud",
  "harassment",
  "conflict_of_interest",
  "irregularity",
  "other",
] as const;

const RELATIONS = ["employee", "supplier", "client", "other"] as const;

export function WhistleblowingForm() {
  const t = useTranslations("whistleblowing");
  const locale = useLocale();
  const [anonymous, setAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      category: String(fd.get("category") || ""),
      description: String(fd.get("description") || ""),
      approximate_date: String(fd.get("approximate_date") || ""),
      relation: String(fd.get("relation") || ""),
      anonymous,
      name: anonymous ? "" : String(fd.get("name") || ""),
      email: anonymous ? "" : String(fd.get("email") || ""),
      phone: anonymous ? "" : String(fd.get("phone") || ""),
      consent: anonymous ? false : fd.get("consent") === "on",
      locale,
    };

    try {
      const res = await fetch("/api/denuncia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error"));
      setProtocol(data.protocol as string);
      e.currentTarget.reset();
      setAnonymous(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  if (protocol) {
    return (
      <div className="form" role="status" style={{ marginTop: 36 }}>
        <p>
          <strong>{t("successTitle")}</strong>
        </p>
        <p>{t("successBody")}</p>
        <p>
          {t("protocolLabel")}: <code>{protocol}</code>
        </p>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setProtocol(null)}
        >
          {t("another")}
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} style={{ marginTop: 36 }}>
      <label>
        {t("category")}
        <select name="category" required defaultValue="">
          <option value="" disabled>
            {t("categoryPlaceholder")}
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`categories.${c}`)}
            </option>
          ))}
        </select>
      </label>

      <label>
        {t("description")}
        <textarea name="description" required minLength={20} maxLength={10000} />
      </label>

      <label>
        {t("approximateDate")}
        <input name="approximate_date" type="text" placeholder={t("approximateDateHint")} />
      </label>

      <label>
        {t("relation")}
        <select name="relation" required defaultValue="">
          <option value="" disabled>
            {t("relationPlaceholder")}
          </option>
          {RELATIONS.map((r) => (
            <option key={r} value={r}>
              {t(`relations.${r}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="form-check">
        <span>
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(ev) => setAnonymous(ev.target.checked)}
          />{" "}
          {t("anonymous")}
        </span>
      </label>

      {!anonymous && (
        <>
          <label>
            {t("name")}
            <input name="name" autoComplete="name" />
          </label>
          <label>
            {t("email")}
            <input name="email" type="email" autoComplete="email" />
          </label>
          <label>
            {t("phone")}
            <input name="phone" type="tel" autoComplete="tel" />
          </label>
          <label className="form-check">
            <span>
              <input name="consent" type="checkbox" required />{" "}
              {t("consent")}
            </span>
          </label>
        </>
      )}

      <p className="muted" style={{ fontSize: "0.9rem" }}>
        {t("disclaimer")}
      </p>

      {error && (
        <p role="alert" style={{ color: "#b00020" }}>
          {error}
        </p>
      )}

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
