'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const sfml = require('sfml.js');
const rmlui = require('../../dist');

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Form input contracts');
assert.ok(rmlui.initialise(window, { highDpi: false }));

try {
  assert.ok(rmlui.loadFontFace(path.resolve(__dirname,
    '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
  const context = rmlui.createContext('form-inputs', 320, 240);
  const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width:320px; height:240px; font-family:LatoLatin; font-size:16px; }
input { width:80px; height:20px; tab-index:auto; }
</style></head><body><form id="first">
<input id="password" type="password" name="secret" value="密🌙"/>
<input name="duplicate" value="first"/><input name="duplicate" value="second"/>
<input id="radio-one" type="radio" name="choice" value="one" checked=""/>
<input id="radio-two" type="radio" name="choice" value="two"/>
<input id="checkbox" type="checkbox" name="flag" checked=""/>
<input value="unnamed"/><input name="disabled" value="disabled" disabled=""/>
<input type="button" name="button" value="button"/>
</form><form id="second">
<input id="other-radio" type="radio" name="choice" value="other" checked=""/>
</form></body></rml>`);
  const form = document.getElementById('first');
  const password = document.getElementById('password');
  const first = document.getElementById('radio-one');
  const second = document.getElementById('radio-two');
  const other = document.getElementById('other-radio');
  const checkbox = document.getElementById('checkbox');
  const submissions = [];
  form.addEventListener('submit', event => {
    submissions.push(event.parameters);
  });

  assert.equal(password.isSubmitted(), true);
  assert.equal(password.getValue(), '密🌙');
  assert.equal(checkbox.getValue(), 'on');
  form.submit();
  assert.deepEqual(submissions[0], {
    submit: '', secret: '密🌙', duplicate: 'first, second',
    choice: 'one', flag: 'on',
  });
  console.log('PASS form-password-radio-checkbox-and-native-submission');

  const changes = [];
  for (const radio of [ first, second, other ]) {
    radio.addEventListener('change', event => {
      changes.push([ radio.id, event.parameters.checked ]);
    });
  }
  second.click();
  assert.equal(first.isSubmitted(), false);
  assert.equal(second.isSubmitted(), true);
  assert.equal(other.isSubmitted(), true);
  assert.deepEqual(changes, [[ 'radio-one', false ], [ 'radio-two', true ]]);
  form.submit('action', 'save');
  assert.deepEqual(submissions[1], {
    action: 'save', secret: '密🌙', duplicate: 'first, second',
    choice: 'two', flag: 'on',
  });
  console.log('PASS form-radio-change-order-and-form-local-exclusivity');

  password.setDisabled(true);
  checkbox.removeAttribute('checked');
  form.submit();
  assert.deepEqual(submissions[2], {
    submit: '', duplicate: 'first, second', choice: 'two',
  });
  password.setDisabled(false);
  assert.equal(password.hasAttribute('disabled'), false);
  console.log('PASS form-disabled-and-unchecked-controls-are-omitted');

  document.show();
  context.update();
  assert.equal(password.focus(), true);
  password.select();
  assert.deepEqual(password.getSelection(), {
    start: 0, end: 2, text: '**',
  });
  password.setValue('');
  password.select();
  assert.deepEqual(password.getSelection(), { start: 0, end: 0, text: '' });
  password.setValue('A🌙中');
  password.setSelectionRange(1, 3);
  assert.deepEqual(password.getSelection(), {
    start: 1, end: 3, text: '**',
  });
  assert.equal(password.getValue(), 'A🌙中');
  password.setAttribute('type', 'text');
  assert.strictEqual(document.getElementById('password'), password);
  assert.equal(password.getValue(), 'A🌙中');
  password.setAttribute('type', 'checkbox');
  assert.equal(password.isSubmitted(), false);
  password.select();
  assert.deepEqual(password.getSelection(), { start: 0, end: 0, text: '' });
  console.log('PASS form-password-empty-unicode-selection-and-type-replacement',
    'native password masks preserved');

  context.remove();
} finally {
  rmlui.shutdown();
  window.close();
}
