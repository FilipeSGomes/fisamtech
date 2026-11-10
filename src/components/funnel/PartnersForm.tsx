"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { WHATSAPP } from "@/lib/config";
import { track } from "@/lib/analytics";

export function PartnersForm() {
  const t = useTranslations("partners");
  const locale = useLocale();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "");
    const email = String(fd.get("email") || "");
    const whatsapp = String(fd.get("whatsapp") || "");
    const idea = String(fd.get("idea") || "");
    const problem = String(fd.get("problem") || "");
    const stage = String(fd.get("stage") || "");

    track("partners_submitted");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company: idea.slice(0, 120) || undefined,
          phone: whatsapp,
          role: stage || "partner",
          challenge: [idea, problem].filter(Boolean).join("\n\n"),
          currency: locale === "pt-br" ? "BRL" : "USD",
          country: locale === "pt-br" ? "BR" : "US",
          locale,
          source: "partners",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Lead failed");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível registrar o lead. Continuando para o WhatsApp."
      );
    }

    const text = [
      "Parceiros / Build with FISAM",
      `Nome: ${name}`,
      `E-mail: ${email}`,
      `Contato: ${whatsapp}`,
      `Ideia: ${idea}`,
      `Problema: ${problem}`,
      `Estágio: ${stage}`,
    ].join("\n");
    window.open(
      `${WHATSAPP.url}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setSent(true);
  }

  return (
    <form className="form" onSubmit={onSubmit} style={{ marginTop: 36 }}>
      <label>
        {t("name")}
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        {t("email")}
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        {t("whatsapp")}
        <input name="whatsapp" required />
      </label>
      <label>
        {t("idea")}
        <textarea name="idea" required />
      </label>
      <label>
        {t("problem")}
        <textarea name="problem" required />
      </label>
      <label>
        {t("stage")}
        <input name="stage" />
      </label>
      <p className="muted">{t("disclaimer")}</p>
      {error && (
        <p role="alert" style={{ color: "#b00020" }}>
          {error}
        </p>
      )}
      <button className="btn btn-primary" type="submit">
        {t("submit")}
      </button>
      {sent && <p role="status">{t("sent")}</p>}
    </form>
  );
}
