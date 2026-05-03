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

function initCookieBanner() {
  const banner = document.getElementById("cookie-banner");
  if (!banner) return;
  if (localStorage.getItem("fisam-cookies-accepted")) {
    banner.classList.add("hidden");
    return;
  }
  const btn = document.getElementById("cookie-accept");
  if (btn) {
    btn.addEventListener("click", () => {
      localStorage.setItem("fisam-cookies-accepted", "true");
      banner.classList.add("hidden");
    });
  }
}

function initContactForm(doc = document, fetchImpl = fetch) {
  const form = doc.querySelector(".contact-form");
  if (!form || typeof form.addEventListener !== "function") return;

  const feedback = doc.getElementById("form-feedback");
  const submitBtn = form.querySelector('button[type="submit"]');
  const whatsappNumber = "5511979562271";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (feedback) {
      feedback.textContent = "Enviando...";
      feedback.classList.remove("error");
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetchImpl(form.action, {
        method: form.method || "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Falha no envio");
      }

      form.reset();
      if (feedback) {
        feedback.textContent = "Mensagem enviada com sucesso.";
        feedback.classList.remove("error");
      }
    } catch (error) {
      if (feedback) {
        const nome = (form.elements.nome && form.elements.nome.value ? form.elements.nome.value : "").trim();
        const whatsapp = (form.elements.whatsapp && form.elements.whatsapp.value ? form.elements.whatsapp.value : "").trim();
        const mensagem = (form.elements.mensagem && form.elements.mensagem.value ? form.elements.mensagem.value : "").trim();
        const text = [
          "Olá, tive erro no envio do formulário do site.",
          `Nome: ${nome || "-"}`,
          `WhatsApp: ${whatsapp || "-"}`,
          `Problema: ${mensagem || "-"}`,
        ].join("\n");
        const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;

        feedback.innerHTML = `Não foi possível enviar agora. <a href="${waLink}" target="_blank" rel="noreferrer">Enviar pelo WhatsApp</a>.`;
        feedback.classList.add("error");
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  initRevealObserver();
  initScrollTextBuildEffect();
  initCookieBanner();
  initContactForm();
}

if (typeof module !== "undefined") {
  module.exports = { initRevealObserver, initScrollTextBuildEffect, initCookieBanner, initContactForm };
}
