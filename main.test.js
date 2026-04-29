const test = require("node:test");
const assert = require("node:assert/strict");
const { initRevealObserver } = require("./main.js");

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
    classList: {
      add(className) {
        this._owner.addedClasses.push(className);
      },
      _owner: null,
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
