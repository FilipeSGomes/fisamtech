"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { type Locale, WHATSAPP } from "@/lib/config";
import { LocaleRegionSwitcher } from "./LocaleRegionSwitcher";

export function SiteHeader({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const current = locale as Locale;
  const isBr = current === "pt-br";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onPointer(e: MouseEvent | TouchEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (!headerRef.current?.contains(target)) setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.documentElement.classList.add("nav-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.documentElement.classList.remove("nav-open");
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  const whatsappHref = `${WHATSAPP.url}?text=${encodeURIComponent(
    "Olá, quero conversar sobre um desafio técnico."
  )}`;

  return (
    <header className="site-header" ref={headerRef}>
      <div className="site-header-inner">
        <Link
          href="/"
          className="brand"
          aria-label="FISAM TECH"
          onClick={closeMenu}
        >
          <img src="/images/perfil-small.png" alt="" width={28} height={28} />
          <span>FISAM TECH</span>
        </Link>

        <nav
          id={menuId}
          className={`nav${menuOpen ? " nav--open" : ""}`}
          aria-label="Main"
        >
          <Link href="/#process" onClick={closeMenu}>
            {t("process")}
          </Link>
          <Link href="/#services" onClick={closeMenu}>
            {t("services")}
          </Link>
          <Link href="/cases" onClick={closeMenu}>
            {t("cases")}
          </Link>
          {(isBr || current === "es") && (
            <Link
              href={isBr ? "/parceiros" : "/partners"}
              onClick={closeMenu}
            >
              {t("partners")}
            </Link>
          )}
          <Link href="/qualify" onClick={closeMenu}>
            {t("discovery")}
          </Link>
          {isBr && (
            <a
              className="btn btn-primary btn-nav"
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              onClick={closeMenu}
            >
              {t("whatsapp")}
            </a>
          )}
        </nav>

        <div className="header-tools">
          <LocaleRegionSwitcher />
          <button
            type="button"
            className={`nav-toggle${menuOpen ? " nav-toggle--open" : ""}`}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="nav-toggle-bar" aria-hidden="true" />
            <span className="nav-toggle-bar" aria-hidden="true" />
            <span className="nav-toggle-bar" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
