const test = require("node:test");
const assert = require("node:assert/strict");
const { initRevealObserver, initScrollTextBuildEffect } = require("./main.js");

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
      add(className) {
        this._owner.addedClasses.push(className);
      },
      _owner: null,
    },
    querySelectorAll() {
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

  const observer = initRevealObserver(mockDocument, MockObserver);

  assert.equal(observer.options.threshold, 0.2);
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

  const observer = initRevealObserver(mockDocument, MockObserver);
  observer.trigger([
    { isIntersecting: true, target: elVisible },
    { isIntersecting: false, target: elHidden },
  ]);

  assert.deepEqual(elVisible.addedClasses, ["visible"]);
  assert.deepEqual(elHidden.addedClasses, []);
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
    const observer = initRevealObserver(mockDocument, MockObserver);

    observer.trigger([{ isIntersecting: true, target: section }]);

    assert.deepEqual(section.addedClasses, ["visible"]);
    assert.ok(text1.addedClasses.includes("is-built"));
    assert.ok(text2.addedClasses.includes("is-built"));
  } finally {
    global.setTimeout = originalSetTimeout;
  }
});
