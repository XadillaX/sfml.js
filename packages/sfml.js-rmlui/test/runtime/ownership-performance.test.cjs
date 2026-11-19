'use strict';

const assert = require('node:assert/strict');
const sfml = require('sfml.js');
const rmlui = require('../../dist');
const native = require('../../build/Release/rmlui.node');

function count(action) {
  native.beginDataDiagnostics(false);
  let counts;
  try {
    action();
  } finally {
    counts = native.endDataDiagnostics();
  }
  return counts;
}

const cases = {
  'stable-custom-views-do-not-scan-instance-ownership': context => {
    const model = context.createDataModel('ownership');
    model.bind('value', 3);
    let updates = 0;
    rmlui.Factory.registerDataViewInstancer(
      new rmlui.DataViewInstancer(element => new rmlui.DataView(element, {
        initialize: () => true,
        update() {
          ++updates;
          return true;
        },
        getVariableNameList: () => [ 'value' ],
      })), 'ownership');
    context.loadDocumentFromMemory(
      '<rml><head/><body data-model="ownership">' +
      '<i data-ownership="value"/>'.repeat(1000) + '</body></rml>');
    context.update();
    assert.equal(updates, 1000);
    const counts = count(() => {
      for (let i = 0; i < 100; ++i) {
        assert.equal(context.getNumDocuments(), 1);
      }
    });
    assert.equal(counts.ownershipInstanceVisits, 0);
    assert.equal(counts.ownershipPasses, 0);
    model.dirtyVariable('value');
    context.update();
    assert.equal(updates, 2000);
  },

  'numeric-attributes-do-not-scan-element-ownership': context => {
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body><i id="item"/></body></rml>');
    const item = document.getElementById('item');
    const counts = count(() => {
      for (let i = 0; i < 100; ++i) {
        item.setAttribute('data-value', i);
      }
    });
    assert.equal(counts.elementOwnershipVisits, 0);
    assert.equal(counts.elementOwnershipPasses, 0);
    assert.equal(item.getAttribute('data-value'), '99');
  },

  'internal-input-replacement-advances-ownership-topology': context => {
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body><input id="field" type="text"/></body></rml>');
    const field = document.getElementById('field');
    const counts = count(() => field.setAttribute('type', 'checkbox'));
    assert.ok(counts.elementOwnershipPasses > 0);
    assert.ok(counts.elementOwnershipVisits > 0);
    assert.equal(field.getAttribute('type'), 'checkbox');
    const stable = count(() => field.setAttribute('value', 7));
    assert.equal(stable.elementOwnershipVisits, 0);
  },

  'listener-registration-work-grows-with-targets': context => {
    for (const size of [ 1000, 10000 ]) {
      const document = context.loadDocumentFromMemory(
        '<rml><head/><body>' + '<i/>'.repeat(size) + '</body></rml>');
      const elements = document.querySelectorAll('i');
      let calls = 0;
      const callback = () => ++calls;
      const registration = count(() => {
        for (const element of elements) {
          element.addEventListener('linear', callback);
        }
      });
      assert.ok(registration.listenerLookupComparisons <= size,
        `Lookup work for ${size} targets: ` +
        registration.listenerLookupComparisons);
      assert.ok(registration.listenerOwnershipVisits <= size * 2,
        `Root visits for ${size} targets: ` +
        registration.listenerOwnershipVisits);
      const repeated = count(() => {
        for (const element of elements) {
          element.addEventListener('linear', callback);
        }
      });
      assert.equal(repeated.listenerLookupComparisons, size);
      assert.equal(repeated.listenerOwnershipVisits, 0);
      elements[0].dispatchEvent('linear');
      elements[size - 1].dispatchEvent('linear');
      assert.equal(calls, 2);
      const stable = count(() => context.getNumDocuments());
      assert.equal(stable.listenerOwnershipVisits, 0);
      assert.equal(stable.typedListenerOwnershipVisits, 0);
      document.close();
      context.update();
    }
  },

  'typed-listener-registration-maintains-only-changed-listeners': context => {
    const size = 1000;
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body>' + '<i/>'.repeat(size) + '</body></rml>');
    const elements = document.querySelectorAll('i');
    let calls = 0;
    const listeners = elements.map(() =>
      new rmlui.EventListener(() => ++calls));
    const registration = count(() => {
      for (let i = 0; i < size; ++i) {
        elements[i].addEventListener('typed-linear', listeners[i]);
      }
    });
    assert.ok(registration.typedListenerOwnershipVisits <= size * 2,
      `Typed root visits: ${registration.typedListenerOwnershipVisits}`);
    elements[0].dispatchEvent('typed-linear');
    elements[size - 1].dispatchEvent('typed-linear');
    assert.equal(calls, 2);
    const stable = count(() => context.getNumDocuments());
    assert.equal(stable.typedListenerOwnershipVisits, 0);
  },

  'shared-typed-listener-maintains-only-new-attachments': context => {
    const size = 1000;
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body>' + '<i/>'.repeat(size) + '</body></rml>');
    const elements = document.querySelectorAll('i');
    let calls = 0;
    const listener = new rmlui.EventListener(() => ++calls);
    const registration = count(() => {
      for (const element of elements) {
        element.addEventListener('shared-linear', listener);
      }
    });
    assert.ok(registration.typedListenerOwnershipVisits <= size * 2);
    for (const element of [ elements[0], elements[size - 1] ]) {
      element.dispatchEvent('shared-linear');
    }
    assert.equal(calls, 2);
    const removal = count(() => {
      for (const element of elements) {
        element.removeEventListener('shared-linear', listener);
      }
    });
    assert.ok(removal.typedListenerOwnershipVisits <= size * 2);
    listener.release();
  },

  'detached-listeners-update-only-affected-root-slots': context => {
    const size = 1000;
    const document = context.createDocument();
    const root = document.createElement('div');
    const children = Array.from({ length: size }, () => {
      const child = document.createElement('i');
      root.appendChild(child);
      return child;
    });
    const callback = () => {};
    const registration = count(() => {
      for (const child of children) {
        child.addEventListener('detached-linear', callback);
      }
    });
    assert.ok(registration.listenerOwnershipVisits <= size * 2);
    const removal = count(() => {
      for (const child of children) {
        child.removeEventListener('detached-linear', callback);
      }
    });
    assert.ok(removal.listenerOwnershipVisits <= size * 2);
    assert.equal(count(() => context.getNumDocuments())
      .listenerOwnershipVisits, 0);
  },

  'listener-identity-index-handles-many-callbacks-on-one-target': context => {
    const size = 1000;
    const document = context.createDocument();
    let calls = 0;
    const callbacks = Array.from({ length: size }, () => () => ++calls);
    const registration = count(() => {
      for (const callback of callbacks) {
        document.addEventListener('identity-linear', callback);
      }
    });
    assert.ok(registration.listenerLookupComparisons <= size * 2,
      `Identity comparisons: ${registration.listenerLookupComparisons}`);
    const repeated = count(() => {
      for (const callback of callbacks) {
        document.addEventListener('identity-linear', callback);
      }
    });
    assert.ok(repeated.listenerLookupComparisons <= size * 2);
    document.dispatchEvent('identity-linear');
    assert.equal(calls, size);
    const removal = count(() => {
      for (const callback of callbacks) {
        document.removeEventListener('identity-linear', callback);
      }
    });
    assert.ok(removal.listenerLookupComparisons <= size * 2);
    document.dispatchEvent('identity-linear');
    assert.equal(calls, size);
  },

  'controller-initialization-does-not-rebuild-all-listener-roots': context => {
    const size = 1000;
    const model = context.createDataModel('controllers');
    model.bind('value', 1);
    rmlui.Factory.registerDataControllerInstancer(
      new rmlui.DataControllerInstancer(element =>
        new rmlui.DataController(element, {
          initialize(_model, target) {
            target.addEventListener('controller-linear', () => {});
            return true;
          },
        })), 'linear');
    const registration = count(() => context.loadDocumentFromMemory(
      '<rml><head/><body data-model="controllers">' +
      '<i data-linear="value"/>'.repeat(size) + '</body></rml>'));
    assert.ok(registration.listenerLookupComparisons <= size);
    assert.ok(registration.listenerOwnershipVisits <= size * 2,
      `Controller root visits: ${registration.listenerOwnershipVisits}`);
  },
};

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(200, 160)), 'Ownership performance');
assert.ok(rmlui.initialise(window, { highDpi: false }));
try {
  for (const [ name, action ] of Object.entries(cases)) {
    if (process.argv[2] && process.argv[2] !== name) {
      continue;
    }
    const context = rmlui.createContext(name, 200, 160);
    action(context);
    rmlui.removeContext(name);
    console.log(`PASS ${name}`);
  }
} finally {
  rmlui.shutdown();
  window.close();
}
