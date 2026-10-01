"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { track } from "@/lib/analytics";

export function CookieBanner() {
  const t = useTranslations("cookies");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = localStorage.getItem("fisam_cookie_consent");
    if (!v) setVisible(true);
  }, []);

  if (!visible) return null;

  function accept() {
    localStorage.setItem("fisam_cookie_consent", "optional");
    track("cookie_accepted");
    setVisible(false);
  }
  function reject() {
    localStorage.setItem("fisam_cookie_consent", "necessary");
    track("cookie_rejected");
    setVisible(false);
  }

  return (
    <div className="cookie-banner" role="dialog" aria-label={t("title")}>
      <strong>{t("title")}</strong>
      <p style={{ marginTop: 8 }}>{t("body")}</p>
      <div className="cookie-actions">
        <button type="button" className="btn btn-primary" onClick={accept}>
          {t("accept")}
        </button>
        <button type="button" className="btn btn-ghost" onClick={reject}>
          {t("reject")}
        </button>
        <Link href="/cookies">{t("link")}</Link>
      </div>
    </div>
  );
}
