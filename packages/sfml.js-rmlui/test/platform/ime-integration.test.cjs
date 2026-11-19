'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packageRoot = path.join(__dirname, '../..');
const temporary = path.join(os.tmpdir(), 'sfmljs-rmlui-ime-contracts');
const addonPath = path.join(temporary, 'cocoa-probes.node');

/**
 * Use the real platform bridge, retaining its Cocoa client for lifetime probes.
 * @param {object} rmlui RmlUi package.
 * @param {string} name Context name.
 * @param {number} left Input position in window pixels.
 * @return {object} Context and its native text input widget.
 */
function inputFor(rmlui, name, left) {
  const context = rmlui.createContext(name, 320, 200);
  const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { margin: 0; font-family: LatoLatin; font-size: 16px; }
input { position: absolute; left: ${left}px; top: 50px;
        width: 100px; height: 30px; }
</style></head><body><input id="input" value="A"/></body></rml>`);
  document.show();
  context.update();
  return { context, document, input: document.getElementById('input') };
}

/**
 * Discard pending host events without submitting them to RmlUi.
 * @param {object} window SFML window.
 */
function discardWindowEvents(window) {
  while (window.pollEvent()) {
    // The application is allowed to discard its independent SFML stream.
  }
}

/** Allow V8's native weak callbacks to release unreachable event owners. */
async function collectEventOwners() {
  for (let i = 0; i < 3; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'cocoa-exception-restores-deferred-input':
    ({ rmlui, native, handle, window }) => {
      const { context, input } = inputFor(rmlui, 'cocoa-exception', 10);
      assert.ok(input.focus());
      const client = native.retainClient(handle);
      discardWindowEvents(window);
      native.failNextInputContextEvent(client);
      native.sendKey(handle, 'a', 0);
      assert.throws(() => context.update(), /native exception/i);
      assert.equal(input.getValue(), 'A');

      native.insertText(client, '中');
      assert.equal(input.getValue(), 'A',
        'Cocoa editing stays deferred after the exception');
      assert.doesNotThrow(() => context.update());
      assert.equal(input.getValue(), '中A');
      native.sendKey(handle, 'a', 0);
      assert.doesNotThrow(() => context.update());
      assert.equal(input.getValue(), '中aA');
    },

  'event-source-collected-after-discard':
    async ({ rmlui, native, handle, window }) => {
      const { context, input } = inputFor(rmlui, 'source-gc', 10);
      assert.ok(input.focus());
      discardWindowEvents(window);
      native.sendKey(handle, 'a', 0);
      let key;
      for (let event; (event = window.pollEvent());) {
        if (event.is('KeyPressed')) {
          key = event;
        }
      }
      const watch = native.watchAKeySource(key.data);
      context.update();
      await collectEventOwners();
      assert.equal(native.sourceAlive(watch), true,
        'a retained native snapshot owns its source');
      key = undefined;
      await collectEventOwners();
      assert.equal(native.sourceAlive(watch), false,
        'discarded events leave no native key history');
    },

  'closing-window-retains-only-held-source':
    async ({ rmlui, native, handle, window }) => {
      const { context, input } = inputFor(rmlui, 'queue-close', 10);
      assert.ok(input.focus());
      discardWindowEvents(window);
      native.sendKey(handle, 'a', 0);
      let key = window.pollEvent();
      assert.ok(key?.is('KeyPressed'));
      const watch = native.watchAKeySource(key.data);
      context.update();
      window.close();
      await collectEventOwners();
      assert.equal(native.sourceAlive(watch), true,
        'the held key owns its source after window destruction');
      key = undefined;
      await collectEventOwners();
      assert.equal(native.sourceAlive(watch), false,
        'releasing the held key leaves no hidden text event owner');
    },

  'native-stream-and-independent-copies':
    ({ sfml, rmlui, native, handle, window }) => {
      const { context, input } = inputFor(rmlui, 'native-copies', 10);
      assert.ok(input.focus());
      let keydowns = 0;
      input.addEventListener('keydown', () => ++keydowns);
      discardWindowEvents(window);

      native.sendKey(handle, 'a', 0);
      const events = [];
      for (let event; (event = window.pollEvent());) {
        events.push(event);
      }
      const keys = events.filter(event => event.is('KeyPressed'));
      const texts = events.filter(event => event.is('TextEntered'));
      assert.equal(keys.length, 1, 'the host still receives its native key');
      assert.equal(texts.length, 0,
        'the claimed key bypasses the hidden SFML text client');
      assert.deepEqual(Object.keys(keys[0].data).sort(),
        [
          'kind', 'code', 'scancode', 'alt', 'control', 'shift', 'system',
        ].sort());

      const copied = new sfml.Event(keys[0].data);
      context.processEvent(copied);
      assert.equal(keydowns, 2, 'native replay and copied key each dispatch');
      context.processEvent(keys[0]);
      context.processEvent(keys[0].data);
      assert.equal(keydowns, 2, 'saved native snapshots stay correlated');
      assert.equal(input.getValue(), 'aA');
      context.processEvent(new sfml.Event({
        kind: 'TextEntered', unicode: 97,
      }));
      assert.equal(input.getValue(), 'aaA',
        'an explicitly submitted text event remains independent');
    },

  'native-events-before-focus-remain-independent':
    ({ rmlui, native, handle, window }) => {
      const { context, input } = inputFor(rmlui, 'before-focus', 10);
      let keydowns = 0;
      input.addEventListener('keydown', () => ++keydowns);
      discardWindowEvents(window);

      native.sendKey(handle, 'a', 0);
      assert.ok(input.focus());
      native.sendKey(handle, 'a', 0);
      for (let event; (event = window.pollEvent());) {
        context.processEvent(event);
      }
      assert.equal(keydowns, 2, 'only the captured key is deduplicated');
      assert.equal(input.getValue(), 'aaA');
    },

  'claimed-text-with-discarded-key-and-wait-event':
    ({ sfml, rmlui, native, handle, window }) => {
      const { context, input } = inputFor(rmlui, 'text-without-key', 10);
      assert.ok(input.focus());
      discardWindowEvents(window);
      native.sendKey(handle, 'a', 0);

      let keys = 0;
      for (let event; (event = window.waitEvent(sfml.milliseconds(1)));) {
        if (event.is('KeyPressed')) {
          keys++;
        }
        assert.equal(event.is('TextEntered'), false);
      }
      assert.equal(keys, 1, 'waitEvent preserves the native key event');
      context.update();
      assert.equal(input.getValue(), 'aA',
        'the input context commits once even when the key is discarded');
      context.processEvent(new sfml.Event({
        kind: 'TextEntered', unicode: 97,
      }));
      assert.equal(input.getValue(), 'aaA');
    },

  'mutated-native-key-is-independent':
    ({ sfml, rmlui, native, handle, window }) => {
      const { context, input } = inputFor(rmlui, 'mutated-native-key', 10);
      assert.ok(input.focus());
      let keydowns = 0;
      input.addEventListener('keydown', () => ++keydowns);
      discardWindowEvents(window);
      native.sendKey(handle, 'a', 0);

      let key;
      for (let event; (event = window.pollEvent());) {
        if (event.is('KeyPressed')) {
          key = event;
        }
      }
      assert.ok(key);
      key.data.code = sfml.Keyboard.Key.B;
      key.data.scancode = sfml.Keyboard.Scan.B;
      context.processEvent(key);
      assert.equal(keydowns, 2, 'edited public data no longer owns native A');
    },

  'discarded-native-key-does-not-consume-synthetic':
    ({ sfml, rmlui, native, handle, window }) => {
      const { context, input } = inputFor(rmlui, 'discarded-key', 10);
      assert.ok(input.focus());
      let keydowns = 0;
      input.addEventListener('keydown', () => ++keydowns);
      discardWindowEvents(window);

      native.sendKey(handle, 'a', 0);
      discardWindowEvents(window);
      context.update();
      assert.equal(keydowns, 1, 'Cocoa key replays once during update');

      context.processEvent(new sfml.Event({
        kind: 'KeyPressed',
        code: sfml.Keyboard.Key.A,
        scancode: sfml.Keyboard.Scan.A,
        alt: false, control: false, shift: false, system: false,
      }));
      assert.equal(keydowns, 2,
        'a synthetic same-value key is an independent event');
    },

  'shared-window-active-caret': ({ rmlui, native, handle }) => {
    const first = inputFor(rmlui, 'first', 10);
    const second = inputFor(rmlui, 'second', 180);
    assert.ok(first.input.focus());
    first.context.render();
    assert.ok(second.input.focus());
    second.context.render();

    const client = native.retainClient(handle);
    const expected = native.caretRectangle(client);
    assert.ok(expected[2] > 0 && expected[3] > 0);
    first.context.render();
    assert.deepEqual(native.caretRectangle(client), expected);

    first.input.setProperty('transform', 'translate(30px, 20px)');
    first.context.update();
    first.context.render();
    assert.deepEqual(native.caretRectangle(client), expected);
    first.context.remove();
    assert.deepEqual(native.caretRectangle(client), expected);
    native.insertText(client, '中');
    second.context.update();
    assert.equal(second.input.getValue(), '中A');
  },

  'destroyed-widget-rejects-retained-client':
    ({ rmlui, native, handle }) => {
      const { context, input, document } = inputFor(rmlui, 'lifetime', 10);
      assert.ok(input.focus());
      const client = native.retainClient(handle);
      native.markText(client, 'pending');
      document.innerRML = '<p>replacement</p>';
      native.insertText(client, 'ignored');
      assert.doesNotThrow(() => context.update());
      assert.equal(document.querySelector('input'), null);
      assert.throws(() => input.getValue(), /valid/i);
    },

  'runtime-restart-rejects-old-client': ({ sfml, rmlui, native, handle,
    window }) => {
    const first = inputFor(rmlui, 'old', 10);
    assert.ok(first.input.focus());
    const client = native.retainClient(handle);
    native.markText(client, 'pending');
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    rmlui.loadFontFace(path.join(packageRoot,
      'third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf'));
    const second = inputFor(rmlui, 'new', 10);
    assert.ok(second.input.focus());
    native.insertText(client, 'ignored');
    second.context.update();
    assert.equal(second.input.getValue(), 'A');
    // A synthetic event remains valid after restarting the same native window.
    second.context.processEvent(new sfml.Event({
      kind: 'TextEntered', unicode: 0x4e2d,
    }));
    assert.equal(second.input.getValue(), '中A');
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const { windowNativeHandle } = require('../../dist/internal/sfml-interop');
  const native = require(addonPath);
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 200)), 'IME integration');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    rmlui.loadFontFace(path.join(packageRoot,
      'third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf'));
    await cases[name]({
      sfml, rmlui, native, window, handle: windowNativeHandle(window),
    });
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.platform !== 'darwin') {
  console.log('SKIP Cocoa integration: macOS required');
} else if (process.argv[2]) {
  run(process.argv[2]).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  fs.mkdirSync(temporary, { recursive: true });
  const builder = path.join(__dirname,
    '../native/platform/build-cocoa-probes.py');
  const build = spawnSync('python3', [ builder, addonPath ], {
    cwd: packageRoot, encoding: 'utf8', timeout: 90000,
  });
  assert.equal(build.error, undefined);
  assert.equal(build.signal, null);
  assert.equal(build.status, 0, build.stdout + build.stderr);
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath, [
      '--expose-gc', __filename, name,
    ], {
      cwd: packageRoot, encoding: 'utf8', timeout: 20000,
    });
    if (result.status === 0) {
      console.log(`PASS ${name}`);
    } else {
      ++failures;
      console.error(`FAIL ${name}`, result.error ?? '',
        result.signal ?? result.status, result.stdout, result.stderr);
    }
  }
  assert.equal(failures, 0, `${failures} Cocoa integration regressions failed`);
}
