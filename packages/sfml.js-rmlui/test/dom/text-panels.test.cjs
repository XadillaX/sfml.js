'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function scene(context) {
  const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { font-family: LatoLatin; font-size: 16px; width: 300px; }
div, tabset, tabs, panels, panel { display: block; }
</style></head><body><div id="host"/><progress id="progress"/>
<tabset id="tabs"/></body></rml>`);
  document.show();
  return document;
}

function textScene(context, value) {
  const document = scene(context);
  const text = document.createTextNode(value);
  document.getElementById('host').appendChild(text);
  context.update();
  return { document, text };
}

const cases = {
  identity({ rmlui, context }) {
    const { document, text } = textScene(context, 'A🌙中 & <literal>');
    assert.ok(text instanceof rmlui.ElementText);
    assert.equal(text.getText(), 'A🌙中 & <literal>');
    assert.strictEqual(document.getElementById('host').getFirstChild(), text);
    assert.ok(text.clone() instanceof rmlui.ElementText);
    for (const [ id, type ] of [
      [ 'progress', 'ElementProgress' ], [ 'tabs', 'ElementTabSet' ],
    ]) {
      const element = document.getElementById(id);
      assert.ok(element instanceof rmlui[type]);
      assert.strictEqual(document.querySelector(`#${id}`), element);
      assert.ok(element.clone() instanceof rmlui[type]);
    }
    text.setText('changed\0🌙');
    assert.equal(text.getText(), 'changed\0🌙');
    document.close();
    context.update();
    assert.throws(() => text.getText(), /no longer valid/i);
  },

  'text-byte-offsets': function({ context }) {
    const { text } = textScene(context, 'A🌙中 &amp; Z');
    const line = text.generateLine(1, Infinity, 0, true, true, false);
    assert.equal(line.line, '🌙中 & Z');
    assert.equal(line.lineLength, 15);
    assert.equal(line.reachedEnd, true);
    assert.ok(line.lineWidth > 0);
    const raw = text.generateLine(1, Infinity, 0, true, false, false);
    assert.equal(raw.line, '🌙中 &amp; Z');
    assert.equal(raw.lineLength, 15);
    assert.deepEqual(text.generateLine(16, Infinity, 0, true, true, false), {
      line: '', lineLength: 0, lineWidth: 0, reachedEnd: true,
    });
    for (const index of [ -1, 2, 3, 4, 6, 7, 17, 2 ** 31 ]) {
      assert.throws(() =>
        text.generateLine(index, Infinity, 0, true, true, false),
      /offset|int32|boundary/i);
    }
    for (const width of [ -1, NaN, -Infinity, 1e100 ]) {
      assert.throws(() =>
        text.generateLine(0, width, 0, true, true, false), /width|float/i);
    }
    assert.throws(() =>
      text.generateLine(0, Infinity, Infinity, true, true, false), /float/i);
  },

  'text-formatting': function({ context }) {
    const { document, text } = textScene(context, '   alpha   beta');
    assert.equal(text.generateLine(0, Infinity, 0, true, true, false).line,
      'alpha beta');
    assert.equal(text.generateLine(0, Infinity, 0, false, true, false).line,
      ' alpha beta');
    assert.deepEqual(text.generateLine(0, 0, 0, true, true, true), {
      line: '', lineLength: 0, lineWidth: 0, reachedEnd: false,
    });
    const overflow = text.generateLine(0, 0, 0, true, true, false);
    assert.equal(overflow.line, 'alpha');
    assert.equal(overflow.lineLength, 8);
    assert.equal(overflow.reachedEnd, false);
    const fit = text.generateLine(0, Infinity, 0, true, true, false);
    const spacing = text.generateLine(0, fit.lineWidth, 100, true, true, false);
    assert.equal(spacing.line, 'alpha');
    assert.equal(spacing.reachedEnd, false);
    document.getElementById('host').setProperty('white-space', 'pre');
    text.setText('a\nb');
    context.update();
    const newline = text.generateLine(0, Infinity, 0, true, true, false);
    assert.equal(newline.line, 'a\n');
    assert.equal(newline.lineLength, 2);
    assert.equal(newline.reachedEnd, false);
    const remainder = text.generateLine(2, Infinity, 0, true, true, false);
    assert.equal(remainder.line, 'b');
  },

  'manual-lines': function({ context }) {
    const { text } = textScene(context, 'original');
    text.suppressAutoLayout();
    text.clearLines();
    text.addLine({ x: 2, y: 20 }, 'manual');
    const snapshot = text.getLines();
    assert.deepEqual(snapshot, [
      { text: 'manual', position: { x: 2, y: 20 }, width: 0 },
    ]);
    text.setText('raw text changed');
    context.update();
    assert.deepEqual(text.getLines(), snapshot);
    assert.equal(context.render(), true);
    const rendered = text.getLines();
    assert.ok(rendered[0].width > 0);
    assert.equal(snapshot[0].width, 0);
    snapshot[0].position.x = 99;
    assert.equal(text.getLines()[0].position.x, 2);
    text.clearLines();
    assert.deepEqual(text.getLines(), []);
    assert.equal(rendered[0].text, 'manual');
  },

  'text-boundaries': function({ context }) {
    const { document, text } = textScene(context, 'A🌙中Z');
    document.getElementById('host').setProperty('word-break', 'break-all');
    context.update();
    const expected = [
      [ 0, 'A', 1 ], [ 1, '🌙', 4 ], [ 5, '中', 3 ], [ 8, 'Z', 1 ],
    ];
    for (const [ offset, line, length ] of expected) {
      const generated = text.generateLine(offset, 0, 0, true, true, false);
      assert.equal(generated.line, line);
      assert.equal(generated.lineLength, length);
    }
    for (const flag of [ 1, null, 'true' ]) {
      assert.throws(() =>
        text.generateLine(0, Infinity, 0, flag, true, false), /boolean/i);
    }
    for (const position of [{ x: NaN, y: 0 }, { x: 0, y: Infinity }]) {
      assert.throws(() => text.addLine(position, 'line'), /float/i);
    }
    const detached = document.createTextNode('unformatted');
    assert.deepEqual(
      detached.generateLine(0, Infinity, 0, true, true, false),
      { line: '', lineLength: 0, lineWidth: 0, reachedEnd: true }
    );
  },

  'snapshot-properties': function({ context }) {
    const { text } = textScene(context, 'snapshot');
    text.clearLines();
    text.addLine({ x: 0, y: 20 }, 'snapshot');
    const keys = [
      'line', 'lineLength', 'lineWidth', 'reachedEnd',
      'text', 'position', 'width', 'x', 'y',
    ];
    let invoked = false;
    const setter = () => {
      invoked = true;
    };
    const descriptors = keys.map(key =>
      Object.getOwnPropertyDescriptor(Object.prototype, key));
    try {
      for (const key of keys) {
        // Intentionally simulate inherited setters at the binding boundary.
        // eslint-disable-next-line no-extend-native
        Object.defineProperty(Object.prototype, key, {
          configurable: true,
          set: setter,
        });
      }
      const generated = text.generateLine(0, Infinity, 0, true, true, false);
      const lines = text.getLines();
      assert.equal(generated.line, 'snapshot');
      assert.equal(lines[0].position.y, 20);
      assert.equal(invoked, false);
    } finally {
      keys.forEach((key, index) => {
        if (descriptors[index]) {
          // Restore the original descriptor before leaving this scenario.
          // eslint-disable-next-line no-extend-native
          Object.defineProperty(Object.prototype, key, descriptors[index]);
        } else {
          delete Object.prototype[key];
        }
      });
    }
  },

  progress({ context }) {
    const document = scene(context);
    const progress = document.getElementById('progress');
    assert.equal(progress.getValue(), 0);
    assert.equal(progress.getMax(), 1);
    progress.setMax(100);
    progress.setValue(25);
    assert.equal(progress.getValue(), 25);
    progress.setValue(150);
    assert.equal(progress.getValue(), 100);
    progress.setValue(-10);
    assert.equal(progress.getValue(), 0);
    progress.setMax(0);
    assert.equal(progress.getMax(), 1);
    progress.setMax(-2);
    assert.equal(progress.getMax(), 1);
    progress.setValue(0.25);
    context.update();
    const size = progress.getIntrinsicDimensions();
    assert.equal(size.valid, true);
    assert.equal(size.dimensions.x, 256);
    assert.ok(size.dimensions.y > 0);
    assert.equal(size.ratio, 0);
    for (const value of [ NaN, Infinity, -Infinity, 1e100, '1' ]) {
      assert.throws(() => progress.setValue(value), /float|number/i);
      assert.throws(() => progress.setMax(value), /float|number/i);
    }
  },

  'tab-ownership': function({ context }) {
    const document = scene(context);
    const tabs = document.getElementById('tabs');
    assert.equal(tabs.getNumTabs(), 0);
    tabs.setTab(999, '<b>One</b>');
    tabs.setPanel(999, 'First');
    assert.equal(tabs.getNumTabs(), 1);
    assert.equal(tabs.querySelector('tab b').innerRML, 'One');
    const title = document.createElement('tab');
    title.innerRML = 'Two';
    const panel = document.createElement('panel');
    panel.innerRML = 'Second';
    tabs.setTab(-1, title);
    tabs.setPanel(-1, panel);
    assert.equal(tabs.getNumTabs(), 2);
    assert.strictEqual(tabs.querySelector('tabs').getChild(1), title);
    assert.strictEqual(tabs.querySelector('panels').getChild(1), panel);
    assert.throws(() => tabs.setTab(0, title), /detached/i);
    const replacement = document.createElement('tab');
    tabs.setTab(1, replacement);
    assert.throws(() => title.tagName, /no longer valid/i);
    tabs.removeTab(-1);
    tabs.removeTab(99);
    assert.equal(tabs.getNumTabs(), 2);
    tabs.removeTab(1);
    assert.throws(() => replacement.tagName, /no longer valid/i);
    assert.throws(() => panel.tagName, /no longer valid/i);
    assert.equal(tabs.getNumTabs(), 1);
    const detached = document.createElement('tabset');
    const ancestor = document.createElement('div');
    ancestor.appendChild(detached);
    assert.throws(() => detached.setPanel(0, ancestor), /ancestor|cycle/i);
    assert.equal(ancestor.tagName, 'div');
  },

  'tab-events': function({ context }) {
    const document = scene(context);
    const tabs = document.getElementById('tabs');
    tabs.setTab(0, 'One');
    tabs.setPanel(0, 'First');
    tabs.setTab(1, '<b id="tab-click">Two</b>');
    tabs.setPanel(1, 'Second');
    assert.equal(tabs.getActiveTab(), 0);
    const indexes = [];
    tabs.addEventListener('tabchange', event => {
      indexes.push(event.parameters.tab_index);
      assert.equal(tabs.getActiveTab(), event.parameters.tab_index);
      assert.throws(() => tabs.getNumTabs(), /callback/i);
      assert.throws(() => tabs.setTab(0, 'Unsafe'), /callback/i);
    });
    tabs.setActiveTab(1);
    tabs.setActiveTab(1);
    tabs.setActiveTab(999); // Native does not clamp.
    assert.deepEqual(indexes, [ 1, 999 ]);
    assert.equal(tabs.getActiveTab(), 999);
    tabs.querySelector('#tab-click').click();
    assert.equal(tabs.getActiveTab(), 1);
    const expected = new Error('tab callback');
    tabs.addEventListener('tabchange', () => {
      throw expected;
    });
    assert.throws(() => tabs.setActiveTab(0), error => error === expected);
    assert.equal(tabs.getActiveTab(), 0);
  },

  'checked-handles': function({ rmlui, context }) {
    const { document, text } = textScene(context, 'safe');
    const div = document.createElement('div');
    assert.throws(() => new rmlui.ElementText(div.handle).getText(), /type/i);
    assert.throws(() =>
      new rmlui.ElementProgress(div.handle).getValue(), /type/i);
    assert.throws(() =>
      new rmlui.ElementTabSet(div.handle).getNumTabs(), /type/i);
    const expected = new Error('position getter');
    assert.throws(() => text.addLine({
      get x() {
        throw expected;
      },
      y: 0,
    }, 'line'), error => error === expected);
    assert.throws(() => text.addLine({
      get x() {
        document.close();
        context.update();
        return 0;
      },
      y: 0,
    }, 'line'), /no longer valid/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)),
    'Text and panel contracts'
  );
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
    await cases[name]({
      rmlui, context: rmlui.createContext('text-panels', 320, 240),
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
  assert.equal(failures, 0, `${failures} text/panel regressions failed`);
}
