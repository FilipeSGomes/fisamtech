"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  COUNTRY_COOKIE,
  REGION_CONFIRMED_KEY,
  findPresetByCountry,
  getCookieValue,
} from "@/lib/config";

export const OPEN_REGION_PICKER_EVENT = "fisam:open-region-picker";

/**
 * Soft geo suggestion — never hard-forces. Confirm keeps current preset;
 * Change opens the flag-first region picker in the header.
 */
export function GeoSuggestionBanner() {
  const t = useTranslations("locale");
  const [visible, setVisible] = useState(false);
  const [suggestedLabel, setSuggestedLabel] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(REGION_CONFIRMED_KEY)) return;
    } catch {
      return;
    }
    const country = getCookieValue(COUNTRY_COOKIE);
    if (!country) return;
    const suggested = findPresetByCountry(country);
    if (!suggested) return;

    const countryName = t(`regions.${suggested.id}.country`);
    const languageName = t(`regions.${suggested.id}.language`);
    setSuggestedLabel(
      `${suggested.flag} ${countryName} · ${languageName} · ${suggested.currencySymbol}`
    );
    setVisible(true);
  }, [t]);

  if (!visible) return null;

  function confirm() {
    try {
      localStorage.setItem(REGION_CONFIRMED_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  function change() {
    setVisible(false);
    window.dispatchEvent(new CustomEvent(OPEN_REGION_PICKER_EVENT));
  }

  return (
    <div className="geo-banner" role="status" aria-live="polite">
      <p className="geo-banner-text">
        {t("suggestPrompt", { region: suggestedLabel })}
      </p>
      <div className="geo-banner-actions">
        <button type="button" className="btn btn-primary" onClick={confirm}>
          {t("confirm")}
        </button>
        <button type="button" className="btn btn-ghost" onClick={change}>
          {t("change")}
        </button>
      </div>
    </div>
  );
}
