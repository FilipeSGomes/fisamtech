function buildTextInScope(scope) {
  if (!scope || typeof scope.querySelectorAll !== "function") return;
  const texts = scope.querySelectorAll(".build-text");
  texts.forEach((node, index) => {
    setTimeout(() => node.classList.add("is-built"), (index % 6) * 90);
  });
}

function initRevealObserver(doc = document, Observer = IntersectionObserver) {
  const observer = new Observer(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          buildTextInScope(entry.target);
          if (typeof observer.unobserve === "function") {
            observer.unobserve(entry.target);
          }
        }
      });
    },
    { threshold: 0.2 }
  );

  doc.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  return observer;
}

function initScrollTextBuildEffect(doc = document, win = window, Observer = IntersectionObserver) {
  const selectors = "main h1, main h2, main h3, main p";
  const nodes = Array.from(doc.querySelectorAll(selectors));
  if (!nodes.length) return null;

  const media = typeof win.matchMedia === "function" ? win.matchMedia("(prefers-reduced-motion: reduce)") : null;

  nodes.forEach((node, index) => {
    node.classList.add("build-text");
    node.style.transitionDelay = `${(index % 6) * 85}ms`;
  });

  if (media && media.matches) {
    nodes.forEach((node) => node.classList.add("is-built"));
    return { disconnect() {} };
  }
  return { disconnect() {} };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  initRevealObserver();
  initScrollTextBuildEffect();
}

if (typeof module !== "undefined") {
  module.exports = { initRevealObserver, initScrollTextBuildEffect };
}
