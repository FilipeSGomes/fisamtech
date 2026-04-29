function initRevealObserver(doc = document, Observer = IntersectionObserver) {
  const observer = new Observer(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.2 }
  );

  doc.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  return observer;
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  initRevealObserver();
}

if (typeof module !== "undefined") {
  module.exports = { initRevealObserver };
}
