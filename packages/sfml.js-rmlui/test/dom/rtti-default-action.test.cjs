'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function scene(context) {
  const document = context.loadDocumentFromMemory(`
<rml><head><style>body { width: 300px; }</style></head><body>
<div id="plain"/><input id="check" type="checkbox"/>
<tabset id="tabs"><tabs><tab/><tab id="second"/></tabs>
<panels><panel/><panel/></panels></tabset>
</body></rml>`);
  document.show();
  context.update();
  return document;
}

const cases = {
  'native-class-identity': function({ rmlui, context }) {
    const document = scene(context);
    const pairs = [
      [ document, rmlui.Document ],
      [ document.createElement('div'), rmlui.Element ],
      [ document.createElement('form'), rmlui.ElementForm ],
      [ document.createElement('input'), rmlui.ElementFormControlInput ],
      [ document.createElement('select'), rmlui.ElementFormControlSelect ],
      [ document.createElement('textarea'), rmlui.ElementFormControlTextArea ],
      [ document.createTextNode('text'), rmlui.ElementText ],
      [ document.createElement('progress'), rmlui.ElementProgress ],
      [ document.createElement('tabset'), rmlui.ElementTabSet ],
    ];
    const base = rmlui.Element.getStaticClassIdentifier();
    const control = rmlui.ElementFormControl.getStaticClassIdentifier();
    const tokens = [];
    for (const [ element, Constructor ] of pairs) {
      const token = Constructor.getStaticClassIdentifier();
      tokens.push(token);
      assert.equal(typeof token, 'symbol');
      assert.strictEqual(element.getClassIdentifier(), token);
      assert.equal(element.isClass(token), true);
      assert.equal(element.isClass(base), true);
      assert.equal(element.isClass(control),
        element instanceof rmlui.ElementFormControl);
      assert.strictEqual(element.clone().getClassIdentifier(), token);
    }
    assert.equal(new Set([ ...tokens, control ]).size, 10);
    context.setDocumentsBaseTag('input');
    const misleading = context.createDocument();
    assert.equal(misleading.tagName, 'input');
    assert.strictEqual(misleading.getClassIdentifier(),
      rmlui.Document.getStaticClassIdentifier());
    assert.equal(misleading.isClass(control), false);
    // Private native subclasses retain actual RTTI through a base facade.
    const image = document.createElement('img');
    assert.ok(image instanceof rmlui.Element);
    assert.notStrictEqual(image.getClassIdentifier(), base);
    assert.equal(image.isClass(base), true);
    assert.equal(image.isClass(image.getClassIdentifier()), true);
    assert.strictEqual(
      image.clone().getClassIdentifier(), image.getClassIdentifier());
    class CustomInput extends rmlui.ElementFormControlInput {}
    assert.strictEqual(CustomInput.getStaticClassIdentifier(),
      rmlui.ElementFormControlInput.getStaticClassIdentifier());
    for (const forged of [ Symbol('RmlUi class'), {}, 1, 'Element', null ]) {
      assert.throws(() => document.isClass(forged), /class.*identifier/i);
    }
  },

  'class-lifetime': function({ rmlui, context, window }) {
    const document = scene(context);
    const input = document.getElementById('check');
    const token = input.getClassIdentifier();
    document.close();
    context.update();
    assert.throws(() => input.getClassIdentifier(), /no longer valid/i);
    assert.throws(() => input.isClass(token), /no longer valid/i);
    rmlui.shutdown();
    assert.strictEqual(rmlui.ElementFormControlInput.getStaticClassIdentifier(),
      token);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const next = scene(rmlui.createContext('next', 320, 240));
    assert.strictEqual(
      next.getElementById('check').getClassIdentifier(), token);
    assert.throws(() => input.isClass(token), /no longer valid/i);
  },

  'manual-tab-action': function({ rmlui, context }) {
    const document = scene(context);
    const tabs = document.getElementById('tabs');
    const changes = [];
    tabs.addEventListener('tabchange', event =>
      changes.push(event.parameters.tab_index));
    tabs.addEventListener('click', event => {
      assert.equal(event.phase, rmlui.EventPhase.Bubble);
      assert.strictEqual(event.currentTarget, tabs);
      event.stopPropagation();
      tabs.processDefaultAction(event);
      tabs.processDefaultAction(event);
      assert.equal(tabs.getActiveTab(), 1);
      assert.equal(event.isPropagating, false);
    });
    assert.equal(
      document.getElementById('second').dispatchEvent('click'), false);
    assert.deepEqual(changes, [ 1 ]);
  },

  'manual-input-action': function({ context }) {
    const document = scene(context);
    const input = document.getElementById('check');
    let changes = 0;
    input.addEventListener('change', () => changes++);
    input.addEventListener('click', event => {
      event.stopPropagation();
      input.processDefaultAction(event);
      assert.notEqual(input.getAttribute('checked'), null);
      input.processDefaultAction(event);
      assert.equal(input.getAttribute('checked'), null);
    });
    input.click();
    assert.equal(changes, 2);
  },

  'manual-base-action': function({ context }) {
    const document = scene(context);
    const plain = document.getElementById('plain');
    plain.addEventListener('mouseover', event => {
      event.stopPropagation();
      plain.processDefaultAction(event);
      assert.strictEqual(document.querySelector('#plain:hover'), plain);
    });
    plain.dispatchEvent('mouseover');
  },

  'automatic-action-retained': function({ context }) {
    const document = scene(context);
    const input = document.getElementById('check');
    let changes = 0;
    input.addEventListener('change', () => changes++);
    input.addEventListener('click', event => {
      input.processDefaultAction(event);
      assert.notEqual(input.getAttribute('checked'), null);
    });
    input.click();
    assert.equal(input.getAttribute('checked'), null);
    assert.equal(changes, 2);
  },

  'nested-manual-actions': function({ context }) {
    const document = scene(context);
    const input = document.getElementById('check');
    input.addEventListener('click', event => {
      event.stopPropagation();
      input.processDefaultAction(event);
    });
    input.addEventListener('change', () => input.dispatchEvent('mouseover'));
    input.addEventListener('mouseover', event => {
      event.stopPropagation();
      input.processDefaultAction(event);
    });
    input.click();
    assert.notEqual(input.getAttribute('checked'), null);
    assert.strictEqual(document.querySelector('#check:hover'), input);
  },

  'action-lease': function({ context }) {
    const document = scene(context);
    const input = document.getElementById('check');
    const other = document.getElementById('plain');
    let retained;
    input.addEventListener('click', event => {
      retained = event;
      assert.throws(() =>
        other.processDefaultAction(event), /current.*element/i);
      assert.throws(() => input.processDefaultAction({}), /RmlEvent/i);
      event.stopPropagation();
    });
    input.addEventListener('click', event => {
      assert.throws(() => input.processDefaultAction(retained), /expired/i);
      input.processDefaultAction(event);
    });
    input.click();
    assert.notEqual(input.getAttribute('checked'), null);
    assert.throws(() => input.processDefaultAction(retained), /expired/i);
  },

  'action-reentry': function({ context }) {
    const document = scene(context);
    const input = document.getElementById('check');
    let click;
    input.addEventListener('click', event => {
      click = event;
      event.stopPropagation();
      input.processDefaultAction(event);
    });
    input.addEventListener('change', () => {
      assert.throws(() =>
        input.processDefaultAction(click), /already.*active/i);
      assert.throws(() => input.setAttribute('type', 'text'), /active|target/i);
      assert.throws(() => document.close(), /callback/i);
    });
    input.click();
    assert.notEqual(input.getAttribute('checked'), null);
  },

  'action-exceptions': function({ context }) {
    const document = scene(context);
    const input = document.getElementById('check');
    const expected = new Error('default action change callback');
    input.addEventListener('click', event => {
      event.stopPropagation();
      input.processDefaultAction(event);
    });
    input.addEventListener('change', () => {
      throw expected;
    });
    assert.throws(() => input.click(), error => error === expected);
    assert.notEqual(input.getAttribute('checked'), null);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  if (name === 'native-class-identity') {
    assert.equal(typeof rmlui.Element.getStaticClassIdentifier, 'function');
    assert.equal(typeof rmlui.Element.getStaticClassIdentifier(), 'symbol');
  }
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'RTTI and default actions'
  );
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({
      rmlui, window, context: rmlui.createContext('rtti', 320, 240),
    });
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath, [ __filename, name ], {
      encoding: 'utf8', timeout: 20000,
    });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0,
    `${failures} RTTI/default-action regressions failed`);
}
