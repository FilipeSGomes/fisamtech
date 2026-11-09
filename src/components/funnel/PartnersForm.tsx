"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { WHATSAPP } from "@/lib/config";
import { track } from "@/lib/analytics";

export function PartnersForm() {
  const t = useTranslations("partners");
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const text = [
      "Parceiros / Build with FISAM",
      `Nome: ${fd.get("name")}`,
      `Contato: ${fd.get("whatsapp")}`,
      `Ideia: ${fd.get("idea")}`,
      `Problema: ${fd.get("problem")}`,
      `Estágio: ${fd.get("stage")}`,
    ].join("\n");
    track("partners_submitted");
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
        <input name="name" required />
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
      <button className="btn btn-primary" type="submit">
        {t("submit")}
      </button>
      {sent && <p role="status">OK</p>}
    </form>
  );
}
