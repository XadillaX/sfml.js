'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function formScene(context) {
  return context.loadDocumentFromMemory(`
<rml><head><style>
body { font-family: LatoLatin; font-size: 16px; width: 300px; height: 200px; }
input, textarea, select { width: 180px; height: 30px; tab-index: auto; }
</style></head><body><form id="form">
<input id="text" name="text" value="A🌙中éZ"/>
<input id="check" type="checkbox" name="check" value="yes"/>
<input id="button" type="button" name="button" value="press"/>
<textarea id="area" name="area"/>
<select id="select" name="choice">
<option value="a">Alpha</option><option value="b">Beta</option>
</select></form></body></rml>`);
}

const cases = {
  identity({ rmlui, context }) {
    const document = formScene(context);
    const pairs = [
      [ 'form', 'ElementForm' ], [ 'text', 'ElementFormControlInput' ],
      [ 'area', 'ElementFormControlTextArea' ],
      [ 'select', 'ElementFormControlSelect' ],
    ];
    for (const [ id, type ] of pairs) {
      const element = document.getElementById(id);
      assert.ok(element instanceof rmlui[type], type);
      assert.strictEqual(document.querySelector(`#${id}`), element);
      assert.strictEqual(document.querySelectorAll(`#${id}`)[0], element);
      assert.strictEqual(new rmlui.Element(element.handle), element);
      assert.ok(element.clone() instanceof rmlui[type]);
      let target;
      element.addEventListener('identity', event => {
        target = event.target;
      });
      element.dispatchEvent('identity');
      assert.strictEqual(target, element);
    }
    for (const tag of [ 'input', 'textarea', 'select' ]) {
      const element = document.createElement(tag);
      assert.ok(element instanceof rmlui.ElementFormControl);
      element.setName(tag);
      assert.equal(element.getName(), tag);
      document.appendChild(element);
      assert.strictEqual(document.removeChild(element), element);
    }
    // The document instancer still creates a Document when its tag says input.
    context.setDocumentsBaseTag('input');
    const disguised = context.createDocument();
    assert.equal(disguised.tagName, 'input');
    assert.ok(disguised instanceof rmlui.Document);
    assert.equal(disguised instanceof rmlui.ElementFormControlInput, false);
    assert.strictEqual(rmlui.Element.wrap(disguised.handle), disguised);
  },

  'values-submission': function({ context }) {
    const document = formScene(context);
    const form = document.getElementById('form');
    const text = document.getElementById('text');
    const check = document.getElementById('check');
    const button = document.getElementById('button');
    const area = document.getElementById('area');
    const select = document.getElementById('select');
    assert.equal(text.getValue(), 'A🌙中éZ');
    assert.equal(text.isSubmitted(), true);
    assert.equal(check.isSubmitted(), false);
    assert.equal(button.isSubmitted(), false);
    check.setAttribute('checked', '');
    assert.equal(check.isSubmitted(), true);
    text.setValue('native & <text>');
    area.setValue('first\nsecond 🌙');
    select.setValue('b'); // Before update: must move native options first.
    assert.equal(select.getValue(), 'b');
    assert.equal(select.getSelection(), 1);
    assert.equal(text.isDisabled(), false);
    text.setDisabled(true);
    assert.equal(text.isDisabled(), true);
    text.setDisabled(false);
    assert.equal(text.getAttribute('disabled'), null);
    const submissions = [];
    form.addEventListener('submit', event => {
      submissions.push(event.parameters);
    });
    form.submit();
    assert.deepEqual(submissions[0], {
      submit: '', text: 'native & <text>', check: 'yes',
      area: 'first\nsecond 🌙', choice: 'b',
    });
    area.setName('text');
    check.setDisabled(true);
    form.submit('action', 'save');
    assert.deepEqual(submissions[1], {
      action: 'save', text: 'native & <text>, first\nsecond 🌙', choice: 'b',
    });
  },

  'unicode-selection': function({ context }) {
    const document = formScene(context);
    document.show();
    context.update();
    for (const id of [ 'text', 'area' ]) {
      const element = document.getElementById(id);
      element.setValue('A🌙中éZ');
      assert.equal(element.focus(), true);
      element.setSelectionRange(1, 3);
      assert.deepEqual(element.getSelection(), {
        start: 1, end: 3, text: '🌙中',
      });
      element.setSelectionRange(5, 3);
      assert.deepEqual(element.getSelection(), {
        start: 3, end: 5, text: 'é',
      });
      element.select();
      assert.deepEqual(element.getSelection(), {
        start: 0, end: 6, text: 'A🌙中éZ',
      });
      element.setCompositionRange(1, 3);
      assert.equal(element.getValue(), 'A🌙中éZ');
      element.setCompositionRange(0, 0);
      element.setSelectionRange(-1, 999);
      assert.deepEqual(element.getSelection(), {
        start: 0, end: 6, text: 'A🌙中éZ',
      });
      element.blur();
      const previous = element.getSelection();
      element.setSelectionRange(1, 2);
      assert.deepEqual(element.getSelection(), previous);
    }
    const check = document.getElementById('check');
    check.select();
    check.setSelectionRange(1, 2);
    check.setCompositionRange(1, 2);
    assert.deepEqual(check.getSelection(), { start: 0, end: 0, text: '' });
  },

  textarea({ context }) {
    const document = formScene(context);
    const area = document.getElementById('area');
    assert.equal(area.getNumColumns(), 20);
    assert.equal(area.getNumRows(), 2);
    assert.equal(area.getMaxLength(), -1);
    assert.equal(area.getWordWrap(), true);
    area.setNumColumns(0);
    area.setNumRows(-1);
    assert.equal(area.getNumColumns(), 1);
    assert.equal(area.getNumRows(), 1);
    area.setNumColumns(24);
    area.setNumRows(4);
    area.setWordWrap(false);
    assert.equal(area.getWordWrap(), false);
    assert.equal(area.getAttribute('wrap'), 'nowrap');
    area.setWordWrap(true);
    assert.equal(area.getAttribute('wrap'), null);
    area.setValue('A🌙中Z');
    area.setMaxLength(3);
    assert.equal(area.getValue(), 'A🌙中');
    assert.equal(area.getMaxLength(), 3);
    // Native SetValue bypasses maxlength; editing and changing the limit clamp.
    area.setValue('A🌙中Z');
    assert.equal(area.getValue(), 'A🌙中Z');
    area.setMaxLength(-2);
    area.setValue('A🌙中Z');
    assert.equal(area.getValue(), 'A🌙中Z');
    document.show();
    context.update();
    const intrinsic = area.getIntrinsicDimensions();
    assert.equal(intrinsic.valid, true);
    assert.ok(intrinsic.dimensions.x > 0);
    assert.ok(intrinsic.dimensions.y > 0);
  },

  options({ context }) {
    const document = formScene(context);
    const select = document.getElementById('select');
    const original = select.getOption(0);
    assert.equal(select.getNumOptions(), 2);
    assert.strictEqual(select.getOption(0), original);
    assert.equal(select.getOption(-1), null);
    assert.equal(select.getOption(99), null);
    assert.equal(select.add('<b>Gamma</b>', 'c'), 2);
    const owned = document.createElement('option');
    owned.setAttribute('value', 'd');
    owned.innerRML = 'Delta';
    assert.equal(select.add(owned, 1), 1);
    assert.strictEqual(select.getOption(1), owned);
    assert.throws(() => select.add(owned), /detached/i);
    const invalid = document.createElement('div');
    assert.throws(() => select.add(invalid), /option/i);
    assert.equal(invalid.tagName, 'div');
    select.setSelection(1);
    assert.equal(select.getValue(), 'd');
    select.setSelection(999);
    assert.equal(select.getSelection(), -1);
    select.setSelection(1);
    select.remove(1);
    assert.throws(() => owned.tagName, /no longer valid/i);
    select.remove(99);
    assert.equal(select.getNumOptions(), 3);
    select.removeAll();
    assert.equal(select.getNumOptions(), 0);
    assert.throws(() => original.tagName, /no longer valid/i);
    assert.equal(select.getSelection(), -1);
    assert.equal(select.add('Disabled', 'x', -1, false), 0);
    assert.equal(select.getOption(0).getAttribute('disabled'), '');
    const pendingSelect = document.createElement('select');
    const pending = document.createElement('option');
    pendingSelect.appendChild(pending);
    assert.strictEqual(pendingSelect.getFirstChild(), pending);
    assert.strictEqual(pendingSelect.getOption(0), pending);
    assert.equal(pendingSelect.getFirstChild(), null);
    assert.equal(pendingSelect.getNumOptions(), 1);
    const discarded = document.createElement('div');
    pendingSelect.appendChild(discarded);
    assert.equal(pendingSelect.getNumOptions(), 1);
    assert.throws(() => discarded.tagName, /no longer valid/i);
  },

  popup({ context }) {
    const document = formScene(context);
    const select = document.getElementById('select');
    document.show();
    context.update();
    select.setSelection(0);
    assert.equal(select.isSelectBoxVisible(), false);
    select.showSelectBox();
    assert.equal(select.isSelectBoxVisible(), true);
    select.setSelection(1);
    select.cancelSelectBox();
    assert.equal(select.isSelectBoxVisible(), false);
    assert.equal(select.getSelection(), 0);
    select.showSelectBox();
    select.setSelection(1);
    select.hideSelectBox();
    assert.equal(select.getSelection(), 1);
    assert.equal(select.isSelectBoxVisible(), false);
  },

  'types-lifetime': function({ rmlui, context }) {
    const document = formScene(context);
    const text = document.getElementById('text');
    const select = document.getElementById('select');
    const div = document.createElement('div');
    assert.equal(div.focus(), false);
    assert.deepEqual(div.getIntrinsicDimensions(), {
      valid: false, dimensions: { x: 0, y: 0 }, ratio: 0,
    });
    assert.throws(() => new rmlui.ElementFormControlInput(div.handle)
      .getValue(), /type/i);
    assert.throws(() => new rmlui.ElementFormControlTextArea(text.handle)
      .getNumRows(), /type/i);
    for (const value of [ NaN, Infinity, 0.1, 2 ** 31, '1' ]) {
      assert.throws(() => text.setSelectionRange(value, 1), /int32/i);
      assert.throws(() => select.getOption(value), /int32/i);
    }
    assert.throws(() => text.setValue({ toString: () => 'coerced' }),
      /string/i);
    assert.throws(() => text.setDisabled(1), /boolean/i);
    assert.throws(() => select.add('x', 'x', -1, 1), /boolean/i);
    document.close();
    context.update();
    assert.throws(() => text.getValue(), /no longer valid/i);
    assert.throws(() => select.getNumOptions(), /no longer valid/i);
  },

  callbacks({ context }) {
    const document = formScene(context);
    const select = document.getElementById('select');
    const form = document.getElementById('form');
    select.getNumOptions();
    const expected = new Error('selection changed');
    select.addEventListener('change', () => {
      assert.equal(select.getValue(), 'b');
      assert.throws(() => select.removeAll(), /callback/i);
      assert.throws(() => select.getNumOptions(), /callback/i);
      throw expected;
    });
    assert.throws(() => select.setValue('b'), error => error === expected);
    assert.equal(select.getValue(), 'b');
    form.addEventListener('submit', () => {
      throw expected;
    });
    assert.throws(() => form.submit(), error => error === expected);
    assert.equal(form.tagName, 'form');
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Control contracts');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
    await cases[name]({
      rmlui, context: rmlui.createContext('controls', 320, 240),
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
  assert.equal(failures, 0, `${failures} control regressions failed`);
}
