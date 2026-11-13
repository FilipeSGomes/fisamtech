"use client";

import { useEffect } from "react";

/** Reveals homepage sections and drives the living energy atmosphere. */
export function CinematicStage() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".home-page");
    if (!root) return;

    document.body.classList.add("is-home");
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-cine]"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    let ignitionTimer = 0;
    try {
      const seen = sessionStorage.getItem("fisam-ignition");
      if (!reduce && !seen) {
        root.classList.add("is-igniting");
        sessionStorage.setItem("fisam-ignition", "1");
        ignitionTimer = window.setTimeout(
          () => root.classList.remove("is-igniting"),
          1600
        );
      }
    } catch {
      // Storage can be blocked. The page stays fully readable.
    }

    if (!reduce) {
      root.classList.add("cine-ready");
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        },
        { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
      );
      nodes.forEach((node) => observer.observe(node));

      const rail = root.querySelector<HTMLElement>(".scroll-rail-fill");
      const hero = root.querySelector<HTMLElement>(".hero");
      const onScroll = () => {
        if (!rail) return;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        rail.style.transform = `scaleY(${progress})`;
      };
      const onMove = (event: PointerEvent) => {
        if (!hero || event.pointerType !== "mouse") return;
        const box = hero.getBoundingClientRect();
        hero.style.setProperty("--hx", `${event.clientX - box.left}px`);
        hero.style.setProperty("--hy", `${event.clientY - box.top}px`);
      };

      const magnets = Array.from(
        root.querySelectorAll<HTMLElement>(".btn-primary")
      );
      const onMagnet = (event: PointerEvent) => {
        const target = event.currentTarget as HTMLElement;
        const box = target.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        target.style.transform = `translate(${dx * 0.12}px, ${dy * 0.18}px)`;
      };
      const resetMagnet = (event: PointerEvent) => {
        (event.currentTarget as HTMLElement).style.transform = "";
      };

      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      if (fine && hero) hero.addEventListener("pointermove", onMove);
      if (fine) {
        magnets.forEach((button) => {
          button.addEventListener("pointermove", onMagnet);
          button.addEventListener("pointerleave", resetMagnet);
        });
      }

      return () => {
        window.clearTimeout(ignitionTimer);
        observer.disconnect();
        window.removeEventListener("scroll", onScroll);
        hero?.removeEventListener("pointermove", onMove);
        magnets.forEach((button) => {
          button.removeEventListener("pointermove", onMagnet);
          button.removeEventListener("pointerleave", resetMagnet);
          button.style.transform = "";
        });
        document.body.classList.remove("is-home");
      };
    }

    return () => {
      window.clearTimeout(ignitionTimer);
      document.body.classList.remove("is-home");
    };
  }, []);

  return (
    <div className="scroll-rail" aria-hidden="true">
      <span className="scroll-rail-fill" />
    </div>
  );
}
