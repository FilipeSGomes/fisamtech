const test = require("node:test");
const assert = require("node:assert/strict");
const {
  initRevealObserver,
  initScrollTextBuildEffect,
  initLandingHeaderScroll,
  prepareRevealItems,
  revealSection,
  prefersReducedMotion,
  initPartnersLanding,
  getPartnersFormData,
  validatePartnersFormData,
  buildPartnersWhatsAppMessage,
  buildPartnersWhatsAppUrl,
  showPartnersForm,
  normalizeWhatsApp,
  PARTNERS_WHATSAPP_NUMBER,
} = require("./main.js");

class MockObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observed = [];
  }

  observe(element) {
    this.observed.push(element);
  }

  trigger(entries) {
    this.callback(entries);
  }
}

function createMockElement() {
  return {
    addedClasses: [],
    style: {},
    _children: [],
    classList: {
      add(...classNames) {
        this._owner.addedClasses.push(...classNames);
      },
      contains() {
        return false;
      },
      _owner: null,
    },
    style: {
      setProperty() {},
      getPropertyValue() {
        return "0ms";
      },
    },
    querySelectorAll(selector) {
      if (selector === ".reveal-item") return [];
      if (selector === ".build-text") return this._children;
      return this._children;
    },
  };
}

test("observa todos os elementos .reveal", () => {
  const el1 = createMockElement();
  const el2 = createMockElement();
  el1.classList._owner = el1;
  el2.classList._owner = el2;

  const mockDocument = {
    querySelectorAll(selector) {
      assert.equal(selector, ".reveal");
      return [el1, el2];
    },
  };

  const observer = initRevealObserver(mockDocument, MockObserver, { setTimeout: (fn) => fn() });

  assert.equal(observer.options.threshold, 0.12);
  assert.deepEqual(observer.observed, [el1, el2]);
});

test("adiciona classe visible apenas para entradas visiveis", () => {
  const elVisible = createMockElement();
  const elHidden = createMockElement();
  elVisible.classList._owner = elVisible;
  elHidden.classList._owner = elHidden;

  const mockDocument = {
    querySelectorAll() {
      return [elVisible, elHidden];
    },
  };

  const observer = initRevealObserver(mockDocument, MockObserver, { setTimeout: (fn) => fn() });
  observer.trigger([
    { isIntersecting: true, target: elVisible },
    { isIntersecting: false, target: elHidden },
  ]);

  assert.deepEqual(elVisible.addedClasses, ["visible"]);
  assert.deepEqual(elHidden.addedClasses, []);
});

test("revealSection aplica visible em secao e itens filhos", () => {
  const originalSetTimeout = global.setTimeout;
  global.setTimeout = (fn) => {
    fn();
    return 0;
  };

  try {
    const itemClasses = [];
    const item = {
      classList: {
        add(className) {
          itemClasses.push(className);
        },
      },
      style: {
        getPropertyValue() {
          return "0ms";
        },
      },
    };

    const sectionClasses = [];
    const section = {
      classList: {
        add(className) {
          sectionClasses.push(className);
        },
        contains(className) {
          return sectionClasses.includes(className);
        },
      },
      querySelectorAll(selector) {
        return selector === ".reveal-item" ? [item] : [];
      },
      _children: [],
    };

    revealSection(section);

    assert.deepEqual(sectionClasses, ["visible"]);
    assert.deepEqual(itemClasses, ["visible"]);
  } finally {
    global.setTimeout = originalSetTimeout;
  }
});

test("prepareRevealItems marca elementos animaveis", () => {
  const added = [];
  const item = {
    classList: {
      add(className) {
        added.push(className);
      },
    },
    style: {
      setProperty() {},
    },
  };
  const section = {
    querySelectorAll(selector) {
      if (selector.includes("index-stat")) return [item];
      return [];
    },
  };

  prepareRevealItems({
    querySelectorAll() {
      return [section];
    },
  });

  assert.deepEqual(added, ["reveal-item"]);
});

test("marca textos principais com classe build-text e delay", () => {
  const n1 = createMockElement();
  const n2 = createMockElement();
  const n3 = createMockElement();
  n1.classList._owner = n1;
  n2.classList._owner = n2;
  n3.classList._owner = n3;

  const mockDocument = {
    querySelectorAll(selector) {
      assert.equal(selector, "main h1, main h2, main h3, main p");
      return [n1, n2, n3];
    },
  };

  const mockWindow = {
    matchMedia() {
      return { matches: false };
    },
  };

  initScrollTextBuildEffect(mockDocument, mockWindow, MockObserver);

  assert.deepEqual(n1.addedClasses, ["build-text"]);
  assert.deepEqual(n2.addedClasses, ["build-text"]);
  assert.deepEqual(n3.addedClasses, ["build-text"]);
  assert.equal(n1.style.transitionDelay, "0ms");
  assert.equal(n2.style.transitionDelay, "60ms");
  assert.equal(n3.style.transitionDelay, "120ms");
});

test("aplica is-built imediatamente com prefers-reduced-motion", () => {
  const n1 = createMockElement();
  const n2 = createMockElement();
  n1.classList._owner = n1;
  n2.classList._owner = n2;

  const mockDocument = {
    querySelectorAll() {
      return [n1, n2];
    },
  };

  const mockWindow = {
    matchMedia() {
      return { matches: true };
    },
  };

  initScrollTextBuildEffect(mockDocument, mockWindow, MockObserver);

  assert.deepEqual(n1.addedClasses, ["build-text", "is-built"]);
  assert.deepEqual(n2.addedClasses, ["build-text", "is-built"]);
});

test("constroi textos da secao quando ela entra no viewport", () => {
  const originalSetTimeout = global.setTimeout;
  global.setTimeout = (fn) => {
    fn();
    return 0;
  };

  try {
    const text1 = createMockElement();
    const text2 = createMockElement();
    text1.classList._owner = text1;
    text2.classList._owner = text2;
    text1.addedClasses.push("build-text");
    text2.addedClasses.push("build-text");

    const section = createMockElement();
    section.classList._owner = section;
    section._children = [text1, text2];

    const mockDocument = {
      querySelectorAll(selector) {
        if (selector === ".reveal") return [section];
        if (selector === "main h1, main h2, main h3, main p") return [text1, text2];
        return [];
      },
    };

    const mockWindow = {
      matchMedia() {
        return { matches: false };
      },
    };

    initScrollTextBuildEffect(mockDocument, mockWindow, MockObserver);
    const observer = initRevealObserver(mockDocument, MockObserver, { setTimeout: (fn) => fn() });

    observer.trigger([{ isIntersecting: true, target: section }]);

    assert.deepEqual(section.addedClasses, ["visible"]);
    assert.ok(text1.addedClasses.includes("is-built"));
    assert.ok(text2.addedClasses.includes("is-built"));
  } finally {
    global.setTimeout = originalSetTimeout;
  }
});

function createPartnersFormMock(values = {}) {
  const elements = {
    nome: { value: values.nome ?? "" },
    whatsapp: { value: values.whatsapp ?? "" },
    ideia: { value: values.ideia ?? "" },
    problema: { value: values.problema ?? "" },
    estagio: { value: values.estagio ?? "" },
  };

  return {
    elements,
    reset() {},
    addEventListener(type, handler) {
      this._submitHandler = handler;
    },
    dispatchSubmit() {
      if (this._submitHandler) {
        this._submitHandler({ preventDefault() {} });
      }
    },
  };
}

test("validatePartnersFormData rejeita campos obrigatorios vazios", () => {
  assert.equal(validatePartnersFormData(null), "Preencha todos os campos obrigatórios.");
  assert.equal(
    validatePartnersFormData({ nome: "", whatsapp: "", ideia: "", problema: "", estagio: "" }),
    "Informe seu nome completo."
  );
  assert.equal(
    validatePartnersFormData({ nome: "Ana", whatsapp: "", ideia: "App", problema: "X", estagio: "Ideia" }),
    "Informe um WhatsApp válido."
  );
  assert.equal(
    validatePartnersFormData({ nome: "Ana", whatsapp: "11999999999", ideia: "", problema: "X", estagio: "Ideia" }),
    "Descreva sua ideia em uma frase."
  );
  assert.equal(
    validatePartnersFormData({ nome: "Ana", whatsapp: "11999999999", ideia: "App", problema: "", estagio: "Ideia" }),
    "Explique o problema e o público-alvo."
  );
  assert.equal(
    validatePartnersFormData({ nome: "Ana", whatsapp: "11999999999", ideia: "App", problema: "Y", estagio: "" }),
    "Selecione o estágio da sua ideia."
  );
  assert.equal(
    validatePartnersFormData({ nome: "Ana", whatsapp: "11999999999", ideia: "App", problema: "Y", estagio: "Ideia" }),
    null
  );
});

test("buildPartnersWhatsAppUrl monta mensagem encoded corretamente", () => {
  const data = {
    nome: "Ana Silva",
    whatsapp: "(11) 99999-9999",
    ideia: "Marketplace local",
    problema: "Conecta produtores e consumidores",
    estagio: "Validação",
  };

  const message = buildPartnersWhatsAppMessage(data);
  assert.match(message, /FISAM TECH Parceiros/);
  assert.match(message, /Nome: Ana Silva/);
  assert.match(message, /Estágio: Validação/);

  const url = buildPartnersWhatsAppUrl(data);
  assert.equal(url.startsWith(`https://wa.me/${PARTNERS_WHATSAPP_NUMBER}?text=`), true);
  const encoded = url.split("?text=")[1];
  const decoded = decodeURIComponent(encoded);
  assert.equal(decoded, message);
});

test("normalizeWhatsApp remove caracteres nao numericos", () => {
  assert.equal(normalizeWhatsApp("(11) 99999-9999"), "11999999999");
});

test("showPartnersForm revela secao e foca primeiro campo", () => {
  const section = {
    hidden: true,
    offsetTop: 420,
    setAttribute(name, value) {
      this[name] = value;
    },
    querySelector() {
      return {
        focus() {
          this.focused = true;
        },
        focused: false,
      };
    },
    scrollIntoView(options) {
      this.scrolled = options;
    },
  };

  showPartnersForm(section);

  assert.equal(section.hidden, false);
  assert.equal(section["aria-hidden"], "false");
  assert.deepEqual(section.scrolled, { behavior: "smooth", block: "start" });
});

test("initPartnersLanding abre formulario ao clicar no CTA", () => {
  const section = {
    hidden: true,
    offsetTop: 100,
    setAttribute(name, value) {
      this[name] = value;
    },
    querySelector() {
      return { focus() {} };
    },
    scrollIntoView() {},
  };

  const startBtn = {
    listeners: {},
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
  };

  const mockDocument = {
    getElementById(id) {
      if (id === "partners-start-btn") return startBtn;
      if (id === "partners-form-section") return section;
      if (id === "partners-form") return null;
      if (id === "partners-form-feedback") return null;
      return null;
    },
  };

  initPartnersLanding(mockDocument);

  assert.equal(typeof startBtn.listeners.click, "function");
  startBtn.listeners.click();
  assert.equal(section.hidden, false);
});

test("initPartnersLanding envia inscricao via WhatsApp quando valida", () => {
  const feedback = { textContent: "", classList: { toggle() {} } };
  const form = createPartnersFormMock({
    nome: "João",
    whatsapp: "11988887777",
    ideia: "SaaS de logística",
    problema: "Pequenas transportadoras",
    estagio: "Protótipo",
  });

  const opened = [];
  const mockWindow = {
    open(url) {
      opened.push(url);
    },
  };

  const mockDocument = {
    getElementById(id) {
      if (id === "partners-start-btn") return null;
      if (id === "partners-form-section") return null;
      if (id === "partners-form") return form;
      if (id === "partners-form-feedback") return feedback;
      return null;
    },
  };

  initPartnersLanding(mockDocument, mockWindow);
  form.dispatchSubmit();

  assert.equal(opened.length, 1);
  assert.match(opened[0], /wa\.me\/5511979562271/);
  assert.match(decodeURIComponent(opened[0]), /João/);
  assert.match(decodeURIComponent(opened[0]), /SaaS de logística/);
});

test("initPartnersLanding nao abre WhatsApp com formulario invalido", () => {
  const feedback = {
    textContent: "",
    classList: {
      hasError: false,
      toggle(className, flag) {
        if (className === "error") this.hasError = flag;
      },
    },
  };
  const form = createPartnersFormMock({ nome: "João" });
  const opened = [];
  const mockWindow = { open(url) { opened.push(url); } };
  const mockDocument = {
    getElementById(id) {
      if (id === "partners-form") return form;
      if (id === "partners-form-feedback") return feedback;
      return null;
    },
  };

  initPartnersLanding(mockDocument, mockWindow);
  form.dispatchSubmit();

  assert.equal(opened.length, 0);
  assert.equal(feedback.textContent, "Informe um WhatsApp válido.");
  assert.equal(feedback.classList.hasError, true);
});

test("getPartnersFormData extrai valores do formulario", () => {
  const form = createPartnersFormMock({
    nome: "Maria",
    whatsapp: "11977776666",
    ideia: "App fitness",
    problema: "Personal trainers",
    estagio: "Ideia",
  });

  assert.deepEqual(getPartnersFormData(form), {
    nome: "Maria",
    whatsapp: "11977776666",
    ideia: "App fitness",
    problema: "Personal trainers",
    estagio: "Ideia",
  });
});
