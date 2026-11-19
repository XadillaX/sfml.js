'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cases = {
  constants({ rmlui }) {
    const header = fs.readFileSync(path.join(__dirname,
      '../../third_party/rmlui/Include/RmlUi/Core/Input.h'), 'utf8');
    let previous = -1;
    for (const [ , name, expression ] of header.matchAll(
      /\b(K[IM]_[A-Z0-9_]+)\s*(?:=\s*(\d+(?:\s*<<\s*\d+)?))?\s*[,/]/g
    )) {
      const [ value, shift = '0' ] = (expression ?? `${previous + 1}`)
        .split('<<');
      previous = Number(value) * 2 ** Number(shift);
      const group = name.startsWith('KI_')
        ? rmlui.KeyIdentifier : rmlui.KeyModifier;
      assert.equal(group[name], previous, name);
    }
  },

  keyboard({ context, document, rmlui }) {
    const { KeyIdentifier: K, KeyModifier: M } = rmlui;
    const events = [];
    document.addEventListener('keydown', event => {
      events.push(event.parameters);
      event.stopPropagation();
    });
    document.addEventListener('keyup', event => events.push(event.parameters));
    // eslint-disable-next-line no-bitwise
    assert.equal(context.processKeyDown(K.KI_PRIOR, M.KM_CTRL | M.KM_META),
      false);
    assert.equal(context.processKeyUp(K.KI_LAST_CUSTOM_KEY, 127), true);
    assert.deepEqual(events.map(event => event.key_identifier), [ 86, 250 ]);
    const names = [
      'ctrl_key', 'shift_key', 'alt_key', 'meta_key', 'caps_lock_key',
      'num_lock_key', 'scroll_lock_key',
    ];
    assert.deepEqual(names.map(name => events[0][name]),
      [ 1, 0, 0, 1, 0, 0, 0 ]);
    assert.deepEqual(names.map(name => events[1][name]),
      [ 1, 1, 1, 1, 1, 1, 1 ]);
    assert.equal(context.processKeyDown(200), false);
    assert.equal(events[2].key_identifier, 200);
  },

  'sfml-keys': function({ sfml, context, document, rmlui }) {
    const extra = {
      PageUp: 'KI_PRIOR', PageDown: 'KI_NEXT',
      LSystem: process.platform === 'darwin' ? 'KI_LMETA' : 'KI_LWIN',
      RSystem: process.platform === 'darwin' ? 'KI_RMETA' : 'KI_RWIN',
      LAlt: 'KI_LMENU', RAlt: 'KI_RMENU', Menu: 'KI_APPS',
      Semicolon: 'KI_OEM_1', Equal: 'KI_OEM_PLUS', Comma: 'KI_OEM_COMMA',
      Hyphen: 'KI_OEM_MINUS', Period: 'KI_OEM_PERIOD', Slash: 'KI_OEM_2',
      Grave: 'KI_OEM_3', LBracket: 'KI_OEM_4', Backslash: 'KI_OEM_5',
      RBracket: 'KI_OEM_6', Apostrophe: 'KI_OEM_7',
      LControl: 'KI_LCONTROL', RControl: 'KI_RCONTROL',
      Backspace: 'KI_BACK', Enter: 'KI_RETURN',
    };
    let received;
    const capture = event => {
      received = event.parameters;
      // Keep Tab and other default actions from changing the focused document.
      event.stopPropagation();
    };
    document.addEventListener('keydown', capture);
    document.addEventListener('keyup', capture);
    const keys = Object.entries(sfml.Keyboard.Key)
      .filter(([ name ]) => Number.isNaN(Number(name)) && name !== 'KeyCount');
    for (const [ name, code ] of keys) {
      const digit = name.startsWith('Num') && !name.startsWith('Numpad');
      const key = extra[name] ?? (digit
        ? `KI_${name.slice(3)}` : `KI_${name.toUpperCase()}`);
      assert.notEqual(rmlui.KeyIdentifier[key], undefined, name);
      for (const kind of [ 'KeyPressed', 'KeyReleased' ]) {
        context.processEvent({
          kind, code, scancode: -1,
          alt: true, control: true, shift: true, system: true,
        });
        assert.equal(received.key_identifier, rmlui.KeyIdentifier[key], name);
        assert.equal(received.alt_key, 1, name);
        assert.equal(received.ctrl_key, 1, name);
        assert.equal(received.shift_key, 1, name);
        assert.equal(received.meta_key, 1, name);
      }
    }
  },

  unicode({ context, document, rmlui }) {
    const input = document.getElementById('text');
    context.processMouseMove(25, 160);
    context.processMouseButtonDown(0);
    context.processMouseButtonUp(0);
    const texts = [];
    input.addEventListener('textinput', event => {
      texts.push(event.parameters.text);
    });
    assert.equal(context.processTextInput('A水😀e\u0301Z'), false);
    assert.equal(input.getAttribute('value'), 'A水😀e\u0301Z');
    const K = rmlui.KeyIdentifier;
    context.processKeyDown(K.KI_END);
    context.processKeyDown(K.KI_LEFT, rmlui.KeyModifier.KM_SHIFT);
    assert.equal(context.processTextInput(0x1f642), false);
    assert.equal(input.getAttribute('value'), 'A水😀e\u0301🙂');
    context.processKeyDown(K.KI_A, rmlui.KeyModifier.KM_CTRL);
    context.processTextInput('新');
    assert.equal(input.getAttribute('value'), '新');
    context.processEvent({ kind: 'TextEntered', unicode: 0x1f600 });
    assert.equal(input.getAttribute('value'), '新😀');
    assert.deepEqual(texts, [ 'A水😀e\u0301Z', '🙂', '新', '😀' ]);
  },

  pointer({ context, child }) {
    child.setProperty('transform', 'translate(30px, 20px)');
    context.update();
    // Element::Render refreshes the transform used by Event::ProjectMouse.
    context.render();
    let saved;
    child.addEventListener('mousemove', event => {
      saved = event;
      assert.equal(event.getParameter('mouse_x', 0), 20);
      assert.equal(event.getParameter('mouse_y', 0), 20);
      event.stopPropagation();
    });
    assert.equal(context.processMouseMove(50, 40), false);
    assert.strictEqual(saved.target, child);
    assert.deepEqual(saved.unprojectedMouseScreenPosition, { x: 50, y: 40 });
    assert.equal(saved.parameters.mouse_x, 20);
    assert.equal(saved.parameters.mouse_y, 20);
    assert.equal(context.isMouseInteracting, true);
    assert.equal(context.processMouseLeave(), true);
    assert.equal(context.isMouseInteracting, false);
    assert.equal(context.processMouseMove(600, 600), true);
  },

  wheel({ sfml, context, child }) {
    context.processMouseMove(20, 20);
    const deltas = [];
    child.addEventListener('mousescroll', event => {
      deltas.push([
        event.parameters.wheel_delta_x, event.parameters.wheel_delta_y,
      ]);
      event.stopPropagation();
    });
    assert.equal(context.processMouseWheel({ x: 2.5, y: -3 }), false);
    assert.equal(context.processMouseWheel(4), false);
    assert.equal(context.processEvent({
      kind: 'MouseWheelScrolled', wheel: sfml.Mouse.Wheel.Horizontal,
      delta: 2, position: { x: 20, y: 20 },
    }), false);
    assert.deepEqual(deltas, [[ 2.5, -3 ], [ 0, 4 ], [ -2, 0 ]]);
  },

  touch({ context, child }) {
    const down = [];
    let clicks = 0;
    child.addEventListener('mousedown', event => {
      down.push(event.parameters.mouse_x);
    });
    child.addEventListener('click', () => clicks++);
    const touches = [
      { identifier: 9007199254740993n, position: { x: 20.5, y: 20.5 } },
      { identifier: 2, position: { x: 30, y: 30 } },
    ];
    assert.equal(context.processTouchStart(touches), false);
    assert.deepEqual(down, [ 20, 30 ]);
    assert.equal(context.processTouchMove(touches), false);
    assert.equal(context.processTouchEnd(touches), false);
    const afterEnd = clicks;
    assert.equal(context.processTouchStart([ touches[0] ]), false);
    assert.equal(context.processTouchCancel([ touches[0] ]), false);
    assert.equal(clicks, afterEnd + 1);
    assert.equal(context.processTouchMove(touches), true);
    assert.equal(context.processTouchEnd(touches), true);
    assert.equal(context.processTouchCancel(touches), false);
    assert.equal(context.processTouchStart([]), true);
    assert.equal(context.processTouchCancel([]), true);
  },

  'sfml-touch': function({ context, child }) {
    let presses = 0;
    let clicks = 0;
    child.addEventListener('mousedown', () => presses++);
    child.addEventListener('click', () => clicks++);
    for (const kind of [ 'TouchBegan', 'TouchMoved', 'TouchEnded' ]) {
      assert.equal(context.processEvent({
        kind, finger: 3, position: { x: 20, y: 20 },
      }), false);
    }
    assert.equal(presses, 1);
    assert.equal(clicks, 1);
  },

  drag({ context, child, document }) {
    child.setProperty('drag', 'drag-drop');
    context.update();
    const sources = [];
    child.addEventListener('dragstart', event => {
      sources.push(event.parameters.drag_element);
      assert.equal(event.getElementParameter('drag_element'), child);
      assert.throws(() => {
        document.innerRML = 'removed';
      }, /active|callback/i);
    });
    document.getElementById('drop').addEventListener('dragdrop', event => {
      sources.push(event.parameters.drag_element);
      assert.equal(event.getElementParameter('drag_element'), child);
    });
    context.processMouseMove(20, 20);
    context.processMouseButtonDown(0);
    context.processMouseMove(40, 30);
    context.processMouseMove(170, 30);
    context.processMouseButtonUp(0);
    assert.deepEqual(sources, [ child, child ]);
  },

  exceptions({ context, child, rmlui }) {
    let saved;
    const failure = new Error('input listener failure');
    const listener = event => {
      saved = event;
      assert.throws(() => context.processMouseLeave(), /callback/i);
      assert.throws(() => context.processKeyDown(12), /callback/i);
      assert.throws(() => context.remove(), /callback/i);
      assert.throws(() => rmlui.shutdown(), /callback/i);
      throw failure;
    };
    child.addEventListener('mousedown', listener);
    context.processMouseMove(20, 20);
    assert.throws(() => context.processMouseButtonDown(0),
      error => error === failure);
    child.removeEventListener('mousedown', listener);
    context.processMouseButtonUp(0);
    assert.throws(() => saved.stopPropagation(), /expired/i);
    rmlui.shutdown();
    assert.equal(saved.type, 'mousedown');
    assert.throws(() => saved.stopPropagation(), /expired/i);
    assert.throws(() => saved.target.id, /initialised|no longer valid/i);
    assert.throws(() => context.processMouseMove(1, 2),
      /initialised|no longer valid/i);
  },

  validation({ context, document }) {
    let events = 0;
    document.addEventListener('keydown', () => events++);
    document.addEventListener('mousedown', () => events++);
    for (const value of [ -1, 251, 1.5, NaN, Infinity, '12', 2n ]) {
      assert.throws(() => context.processKeyDown(value), /key/i);
    }
    for (const value of [ -1, 128, 1.2, NaN, '1' ]) {
      assert.throws(() => context.processKeyUp(12, value), /modifier/i);
    }
    for (const value of [ -1, 0x110000, 0xd800, 1.5, NaN, {}, '\ud800' ]) {
      assert.throws(() => context.processTextInput(value), /unicode|text/i);
    }
    for (const value of [ NaN, Infinity, 1.5, 2 ** 31 ]) {
      assert.throws(() => context.processMouseMove(value, 0), /coordinate/i);
    }
    assert.throws(() => context.processMouseWheel({ x: NaN, y: 0 }), /wheel/i);
    assert.throws(() => context.processMouseButtonDown(-1), /button/i);
    const valid = { identifier: 1, position: { x: 20, y: 20 } };
    for (const invalid of [
      { ...valid, identifier: -1n }, { ...valid, identifier: 2n ** 64n },
      { ...valid, identifier: 2 ** 53 },
      { ...valid, position: { x: Infinity, y: 0 } },
    ]) {
      assert.throws(() => context.processTouchStart([ valid, invalid ]),
        /touch/i);
    }
    assert.equal(events, 0);
    const failure = new Error('touch getter failure');
    assert.throws(() => context.processTouchMove([{
      get identifier() {
        throw failure;
      }, position: { x: 0, y: 0 },
    }]), error => error === failure);
  },

  'getter-lifetime': function({ context }) {
    const delta = {
      get x() {
        context.remove();
        return 1;
      },
      y: 0,
    };
    assert.throws(() => context.processMouseWheel(delta), /no longer valid/i);
  },

  'sfml-validation': function({ context }) {
    const failure = new Error('event getter failure');
    assert.throws(() => context.processEvent({
      kind: 'MouseMoved',
      get position() {
        throw failure;
      },
    }), error => error === failure);
    for (const event of [
      { kind: 'MouseMoved', position: { x: NaN, y: 0 } },
      { kind: 'MouseButtonPressed', button: 99, position: { x: 0, y: 0 } },
      { kind: 'TextEntered', unicode: 0xd800 },
      { kind: 'TouchBegan', finger: -1, position: { x: 0, y: 0 } },
    ]) {
      assert.throws(() => context.processEvent(event), /invalid/i);
    }
    assert.throws(() => context.processEvent({
      kind: 'MouseMoved',
      get position() {
        context.remove();
        return { x: 10, y: 20 };
      },
    }), /no longer valid/i);
  },
};

function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(260, 220)), 'RmlUi input test');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    rmlui.loadFontFace(path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf'));
    const context = rmlui.createContext('input', 260, 220);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 260px; height: 220px; margin: 0; font-family: LatoLatin; }
button { position: absolute; left: 0; top: 0; width: 100px; height: 80px; }
#drop { position: absolute; left: 150px; top: 0; width: 100px; height: 80px; }
input { position: absolute; left: 10px; top: 150px;
        width: 230px; height: 40px; }
</style></head><body><button/><div id="drop"/>
<input id="text" type="text"/></body></rml>`);
    document.show();
    context.update();
    cases[name]({
      sfml, rmlui, context, document, child: document.querySelector('button'),
    });
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]);
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
  assert.equal(failures, 0, `${failures} input regressions failed`);
}
