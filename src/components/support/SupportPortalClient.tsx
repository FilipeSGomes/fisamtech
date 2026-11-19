"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

const PRIORITIES = ["low", "medium", "high", "critical"] as const;

type TicketView = {
  ticket_number: string;
  status: string;
  priority: string;
  subject: string;
  created_at: string;
  updated_at: string;
  status_history: { status: string; at: string; note?: string }[];
  closure_policy: string;
};

function OpenTicketForm({
  locale,
  onGoTrack,
}: {
  locale: string;
  onGoTrack: () => void;
}) {
  const t = useTranslations("supportTickets");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      company_name: String(fd.get("company_name") || ""),
      company_cnpj: String(fd.get("company_cnpj") || ""),
      priority: String(fd.get("priority") || ""),
      subject: String(fd.get("subject") || ""),
      description: String(fd.get("description") || ""),
      consent: fd.get("consent") === "on" ? true : false,
      locale,
    };

    try {
      const res = await fetch("/api/chamados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("error"));
      if (data.degraded) setError(t("degraded"));
      setTicketNumber(data.ticket_number as string);
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  if (ticketNumber) {
    return (
      <div className="form support-success" role="status">
        <p>
          <strong>{t("successTitle")}</strong>
        </p>
        <p>{t("successBody")}</p>
        <p>
          {t("ticketLabel")}: <code>{ticketNumber}</code>
        </p>
        <p className="muted">{t("trackHint")}</p>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setTicketNumber(null);
            onGoTrack();
          }}
        >
          {t("goTrack")}
        </button>
      </div>
    );
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
        {t("phone")}
        <input name="phone" type="tel" required autoComplete="tel" />
      </label>
      <label>
        {t("companyName")}
        <input name="company_name" autoComplete="organization" />
      </label>
      <label>
        {t("companyCnpj")}
        <input name="company_cnpj" inputMode="numeric" />
      </label>
      <label>
        {t("priority")}
        <select name="priority" required defaultValue="medium">
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {t(`priorities.${p}`)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("subject")}
        <input name="subject" required maxLength={300} />
      </label>
      <label>
        {t("description")}
        <textarea name="description" required rows={6} minLength={20} />
      </label>
      <label className="checkbox-label">
        <input name="consent" type="checkbox" required />
        {t("consent")}
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? t("sending") : t("submit")}
      </button>
    </form>
  );
}

function TrackTicketForm() {
  const t = useTranslations("supportTickets");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketView | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTicket(null);

    const fd = new FormData(e.currentTarget);
    const ticket_number = String(fd.get("ticket_number") || "");
    const email = String(fd.get("email") || "");

    try {
      const qs = new URLSearchParams({ ticket_number, email });
      const res = await fetch(`/api/chamados?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "not_found") throw new Error(t("notFound"));
        throw new Error(data.error || t("error"));
      }
      setTicket(data as TicketView);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  if (ticket) {
    return (
      <div className="support-ticket-detail">
        <p>
          <strong>{t("ticketLabel")}:</strong> <code>{ticket.ticket_number}</code>
        </p>
        <p>
          <strong>{t("statusLabel")}:</strong> {t(`statuses.${ticket.status}`)}
        </p>
        <p>
          <strong>{t("priority")}:</strong> {t(`priorities.${ticket.priority}`)}
        </p>
        <p>
          <strong>{t("subject")}:</strong> {ticket.subject}
        </p>
        <p className="muted" style={{ fontSize: "0.9rem" }}>
          {t("updatedAt")}: {new Date(ticket.updated_at).toLocaleString(locale)}
        </p>
        <h3>{t("historyTitle")}</h3>
        <ol className="support-status-list">
          {ticket.status_history.map((entry, i) => (
            <li key={`${entry.at}-${i}`}>
              <span className="muted">
                {new Date(entry.at).toLocaleString(locale)}
              </span>
              {" — "}
              {t(`statuses.${entry.status}`)}
              {entry.note ? ` — ${entry.note}` : null}
            </li>
          ))}
        </ol>
        <p className="support-closure-note">{t("closurePolicy")}</p>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setTicket(null)}
        >
          {t("anotherLookup")}
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <p className="muted">{t("trackLead")}</p>
      <label>
        {t("ticketNumber")}
        <input
          name="ticket_number"
          required
          placeholder="FT-2026-XXXXXX"
          pattern="FT-[0-9]{4}-[A-Z0-9]{6}"
          title={t("ticketFormat")}
        />
      </label>
      <label>
        {t("email")}
        <input name="email" type="email" required autoComplete="email" />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? t("looking") : t("lookupSubmit")}
      </button>
    </form>
  );
}

export function SupportPortalClient() {
  const t = useTranslations("supportTickets");
  const locale = useLocale();
  const [tab, setTab] = useState<"open" | "track">("open");

  return (
    <div className="support-portal">
      <div className="support-portal-tabs" role="tablist" aria-label={t("tabsLabel")}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "open"}
          className={tab === "open" ? "is-active" : undefined}
          onClick={() => setTab("open")}
        >
          {t("tabOpen")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "track"}
          className={tab === "track" ? "is-active" : undefined}
          onClick={() => setTab("track")}
        >
          {t("tabTrack")}
        </button>
      </div>

      {tab === "open" ? (
        <OpenTicketForm locale={locale} onGoTrack={() => setTab("track")} />
      ) : (
        <TrackTicketForm />
      )}
    </div>
  );
}