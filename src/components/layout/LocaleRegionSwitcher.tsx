"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import {
  COUNTRY_COOKIE,
  CURRENCY_COOKIE,
  LOCALE_COOKIE,
  REGION_CONFIRMED_KEY,
  REGION_PRESETS,
  resolveActivePreset,
  getCookieValue,
  type Locale,
  type RegionPreset,
} from "@/lib/config";
import type { Currency } from "@fisamtech/payments";
import { SUPPORTED_CURRENCIES } from "@fisamtech/payments";
import { track } from "@/lib/analytics";
import { OPEN_REGION_PICKER_EVENT } from "./GeoSuggestionBanner";

function subscribeCookie(cb: () => void) {
  window.addEventListener("focus", cb);
  return () => window.removeEventListener("focus", cb);
}

function readCountryCookie() {
  return getCookieValue(COUNTRY_COOKIE);
}

function readCurrencyCookie() {
  return getCookieValue(CURRENCY_COOKIE);
}

export function LocaleRegionSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [desktopPos, setDesktopPos] = useState<{ top: number; right: number } | null>(
    null
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setDesktopPos(null);
      return;
    }
    function place() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      // Mobile uses CSS bottom-sheet; only anchor on wider viewports
      if (window.matchMedia("(max-width: 640px)").matches) {
        setDesktopPos(null);
        return;
      }
      const rect = trigger.getBoundingClientRect();
      setDesktopPos({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const country = useSyncExternalStore(
    subscribeCookie,
    readCountryCookie,
    () => null
  );
  const currency = useSyncExternalStore(
    subscribeCookie,
    readCurrencyCookie,
    () => null
  );

  const active = resolveActivePreset(locale, country, currency);
  const primary = REGION_PRESETS.filter((p) => p.group === "primary");
  const latam = REGION_PRESETS.filter((p) => p.group === "latam");

  const setOpenSafe = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setAdvancedOpen(false);
  }, []);

  useEffect(() => {
    function onOpenRequest() {
      setOpenSafe(true);
      triggerRef.current?.focus();
    }
    window.addEventListener(OPEN_REGION_PICKER_EVENT, onOpenRequest);
    return () =>
      window.removeEventListener(OPEN_REGION_PICKER_EVENT, onOpenRequest);
  }, [setOpenSafe]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenSafe(false);
        triggerRef.current?.focus();
      }
    }
    function onPointer(e: MouseEvent | TouchEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      const inTrigger = rootRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (!inTrigger && !inPanel) setOpenSafe(false);
    }
    document.documentElement.classList.add("region-open");
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.documentElement.classList.remove("region-open");
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, setOpenSafe]);

  function persistRegion(preset: RegionPreset) {
    const maxAge = 31536000;
    document.cookie = `${LOCALE_COOKIE}=${preset.locale};path=/;max-age=${maxAge};samesite=lax`;
    document.cookie = `${CURRENCY_COOKIE}=${preset.currency};path=/;max-age=${maxAge};samesite=lax`;
    document.cookie = `${COUNTRY_COOKIE}=${preset.country};path=/;max-age=${maxAge};samesite=lax`;
    try {
      localStorage.setItem(REGION_CONFIRMED_KEY, "1");
    } catch {
      /* ignore */
    }
    track("locale_changed", { locale: preset.locale, country: preset.country });
    track("currency_changed", {
      currency: preset.currency,
      country: preset.country,
    });
  }

  function selectPreset(preset: RegionPreset) {
    persistRegion(preset);
    setOpenSafe(false);
    if (preset.locale !== locale) {
      router.replace(pathname, { locale: preset.locale });
    } else {
      // Same locale, currency/country updated — soft refresh signal
      router.refresh();
    }
  }

  function setCurrencyOnly(next: Currency) {
    const maxAge = 31536000;
    document.cookie = `${CURRENCY_COOKIE}=${next};path=/;max-age=${maxAge};samesite=lax`;
    const match = REGION_PRESETS.find((p) => p.currency === next);
    if (match) {
      document.cookie = `${COUNTRY_COOKIE}=${match.country};path=/;max-age=${maxAge};samesite=lax`;
    }
    track("currency_changed", { currency: next, advanced: true });
    setOpenSafe(false);
    router.refresh();
  }

  function rowLabel(preset: RegionPreset) {
    const countryName = t(`regions.${preset.id}.country`);
    const languageName = t(`regions.${preset.id}.language`);
    return `${countryName} · ${languageName} · ${preset.currencySymbol}`;
  }

  function renderRow(preset: RegionPreset) {
    const selected = preset.id === active.id;
    return (
      <button
        key={preset.id}
        type="button"
        role="option"
        aria-selected={selected}
        className={`region-row${selected ? " region-row--active" : ""}`}
        onClick={() => selectPreset(preset)}
      >
        <span className="region-row-flag" aria-hidden="true">
          {preset.flag}
        </span>
        <span className="region-row-text">
          <span className="region-row-title">{rowLabel(preset)}</span>
          <span className="region-row-meta">
            {preset.currency}
          </span>
        </span>
        {selected && (
          <span className="region-row-check" aria-hidden="true">
            ✓
          </span>
        )}
      </button>
    );
  }

  const panel =
    open && mounted
      ? createPortal(
          <>
            <div
              className="region-backdrop"
              aria-hidden="true"
              onClick={() => setOpenSafe(false)}
            />
            <div
              ref={panelRef}
              id={panelId}
              className="region-panel"
              role="listbox"
              aria-label={t("chooseRegion")}
              style={
                desktopPos
                  ? { top: desktopPos.top, right: desktopPos.right }
                  : undefined
              }
            >
              <div className="region-panel-handle" aria-hidden="true" />
              <p className="region-panel-title">{t("chooseRegion")}</p>
              <div className="region-panel-scroll">
                <div className="region-group">{primary.map(renderRow)}</div>
                <p className="region-group-label">{t("latamGroup")}</p>
                <div className="region-group">{latam.map(renderRow)}</div>

                <details
                  className="region-advanced"
                  open={advancedOpen}
                  onToggle={(e) =>
                    setAdvancedOpen((e.target as HTMLDetailsElement).open)
                  }
                >
                  <summary>{t("advancedCurrency")}</summary>
                  <p className="region-advanced-hint">{t("advancedHint")}</p>
                  <div className="region-currency-grid">
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`region-currency-chip${
                          active.currency === c
                            ? " region-currency-chip--active"
                            : ""
                        }`}
                        onClick={() => setCurrencyOnly(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <div className="region-switcher" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="region-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${t("chooseRegion")}: ${rowLabel(active)}`}
        onClick={() => setOpenSafe(!open)}
      >
        <span className="region-trigger-flag" aria-hidden="true">
          {active.flag}
        </span>
        <span className="region-trigger-code">{active.code}</span>
      </button>
      {panel}
    </div>
  );
}
