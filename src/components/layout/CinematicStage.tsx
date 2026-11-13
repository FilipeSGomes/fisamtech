"use client";

import { useEffect } from "react";

/** Reveals homepage sections as they enter the viewport. Motion is skipped when reduced. */
export function CinematicStage() {
  useEffect(() => {
    const root = document.querySelector(".home-page");
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-cine]"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

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
    return () => observer.disconnect();
  }, []);

  return null;
}
