'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'duplicate-context-does-not-replace-live-identity': ({ rmlui, context }) => {
    const dimensions = context.dimensions;
    assert.throws(() => rmlui.createContext('boundaries', 1, 1),
      /failed to create.*context/i);
    assert.equal(rmlui.getNumContexts(), 1);
    assert.strictEqual(rmlui.getContext('boundaries'), context);
    assert.deepEqual({ ...dimensions }, { width: 160, height: 120 });
    assert.equal(context.update(), true);
    assert.equal(rmlui.removeContext('boundaries'), true);
    assert.equal(rmlui.removeContext('boundaries'), false);
    const next = rmlui.createContext('boundaries', 40, 30);
    assert.notStrictEqual(next, context);
    assert.deepEqual({ ...dimensions }, { width: 0, height: 0 });
    assert.throws(() => context.update(), /no longer valid/i);
    assert.equal(next.update(), true);
  },

  'repeated-shutdown-and-preinit-calls-preserve-generations':
    ({ rmlui, window, context }) => {
      const document = context.createDocument();
      rmlui.shutdown();
      assert.equal(rmlui.shutdown(), undefined);
      for (const operation of [
        () => rmlui.createContext('early', 1, 1),
        () => rmlui.getNumContexts(),
        () => rmlui.releaseTextures(),
      ]) {
        assert.throws(operation, /initialised/i);
      }
      assert.equal(rmlui.initialise(window, { highDpi: false }), true);
      const next = rmlui.createContext('boundaries', 160, 120);
      assert.throws(() => context.update(), /no longer valid/i);
      assert.throws(() => document.show(), /no longer valid/i);
      assert.equal(next.update(), true);
    },

  'mouse-interaction-follows-pointer-events-independently-of-opacity':
    ({ rmlui, context }) => {
      const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width:160px; height:120px; pointer-events:none; }
#target { position:absolute; left:10px; top:10px; width:40px; height:40px;
          pointer-events:auto; }
</style></head><body><div id="target"/></body></rml>`);
      document.show(false, rmlui.FocusFlag.None);
      const target = document.getElementById('target');
      for (const opacity of [ '0', '0.5', '1' ]) {
        for (const pointerEvents of [ 'auto', 'none' ]) {
          assert.equal(target.setProperty('opacity', opacity), true);
          assert.equal(
            target.setProperty('pointer-events', pointerEvents), true);
          document.updateDocument();
          context.update();
          context.processMouseMove(20, 20);
          const interactive = pointerEvents === 'auto';
          assert.equal(context.isMouseInteracting, interactive);
          assert.strictEqual(context.getHoverElement(),
            interactive ? target : context.getRootElement());
          context.processMouseLeave();
          assert.equal(context.isMouseInteracting, false);
        }
      }
    },

  'disabled-option-user-action-and-programmatic-selection-use-native-rules':
    ({ context }) => {
      const document = context.loadDocumentFromMemory(
        '<rml><body><select id="select"/></body></rml>');
      const select = document.getElementById('select');
      assert.equal(select.add('Enabled', 'enabled'), 0);
      assert.equal(select.add('Disabled', 'disabled', -1, false), 1);
      const disabled = select.getOption(1);
      assert.equal(disabled.hasAttribute('disabled'), true);
      select.setSelection(0);
      const changes = [];
      select.addEventListener('change', event => {
        changes.push(event.parameters.value);
      });
      disabled.click();
      assert.equal(select.getSelection(), 0);
      assert.equal(select.getValue(), 'enabled');
      assert.deepEqual(changes, []);
      select.setSelection(1);
      assert.equal(select.getSelection(), 1);
      assert.equal(select.getValue(), 'disabled');
      assert.deepEqual(changes, [ 'disabled' ]);
      select.remove(1);
      assert.equal(select.getSelection(), -1);
      assert.equal(select.getValue(), '');
      assert.deepEqual(changes, [ 'disabled', '' ]);
      assert.throws(() => disabled.tagName, /no longer valid/i);
    },

  'transformed-bounds-use-rendered-native-matrices-and-box-areas':
    ({ rmlui, context }) => {
      const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width:160px; height:120px; }
#target { position:absolute; left:20px; top:30px; width:40px; height:20px;
          padding:3px; border:2px #fff; transform:translate(11px, 17px); }
</style></head><body><div id="target"/></body></rml>`);
      document.show(false, rmlui.FocusFlag.None);
      context.update();
      context.render();
      const target = document.getElementById('target');
      const assertBounds = (area, expected) => {
        const actual = rmlui.ElementUtilities.getBoundingBox(target, area);
        assert.ok(actual);
        for (const corner of [ 'p0', 'p1' ]) {
          for (const axis of [ 'x', 'y' ]) {
            // Native projection uses float32 matrix arithmetic.
            assert.ok(Math.abs(actual[corner][axis] -
              expected[corner][axis]) < 0.0001, `${corner}.${axis}`);
          }
        }
      };
      assertBounds(rmlui.BoxArea.Border, {
        p0: { x: 31, y: 47 }, p1: { x: 81, y: 77 },
      });
      assertBounds(rmlui.BoxArea.Content, {
        p0: { x: 36, y: 52 }, p1: { x: 76, y: 72 },
      });
      target.setProperty('transform', 'translateZ(20000px)');
      document.updateDocument();
      context.render();
      assert.equal(rmlui.ElementUtilities.getBoundingBox(
        target, rmlui.BoxArea.Border), null);
      target.setProperty('transform', 'none');
      document.updateDocument();
      context.render();
      assertBounds(rmlui.BoxArea.Border, {
        p0: { x: 20, y: 30 }, p1: { x: 70, y: 60 },
      });
    },
};

function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Core boundaries');
  assert.equal(rmlui.initialise(window, { highDpi: false }), true);
  try {
    const context = rmlui.createContext('boundaries', 160, 120);
    cases[name]({ rmlui, window, context });
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
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} Core boundary failures`);
}
