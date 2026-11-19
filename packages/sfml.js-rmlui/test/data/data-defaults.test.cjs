'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function load(context, model, content) {
  const document = context.loadDocumentFromMemory(
    `<rml><head/><body data-model="${model}">${content}</body></rml>`);
  document.show();
  context.update();
  return document;
}

function arraySchema(model, kind) {
  const types = model.getDataTypeRegister();
  const scalar = types.registerScalar(`${kind}Value`, kind);
  return types.registerArray(`${kind}Values`, scalar);
}

const cases = {
  'attribute-class-style-if-visible-rml-and-text': ({ rmlui, context }) => {
    const model = context.createDataModel('defaults');
    model.bind('title', 'First <literal>');
    model.bind('enabled', true);
    model.bind('markup', '<strong id="inserted">Original</strong>');
    model.bind('color', '#ff0000');
    const document = load(context, 'defaults', `
      <div id="attributes" data-attr-title="title"
        data-attrif-disabled="enabled" data-class-active="enabled"
        data-style-color="color">{{title}} / {{enabled}}</div>
      <div id="if" data-if="enabled">conditional</div>
      <div id="visible" data-visible="enabled">visible</div>
      <div id="rml" data-rml="markup"/>
    `);
    const attributes = document.getElementById('attributes');
    assert.equal(attributes.getAttribute('title'), 'First <literal>');
    assert.equal(attributes.hasAttribute('disabled'), true);
    assert.equal(attributes.isClassSet('active'), true);
    assert.equal(attributes.getProperty('color').value.red, 255);
    assert.equal(attributes.getChild(0).getText(), 'First <literal> / 1');
    assert.equal(document.getElementById('inserted').innerRML, 'Original');
    model.applyPatch({
      '$.title': 'Second & literal',
      '$.enabled': false,
      '$.markup': '<em id="replacement">Changed</em>',
      '$.color': '#0000ff',
    });
    context.update();
    assert.equal(attributes.getAttribute('title'), 'Second & literal');
    assert.equal(attributes.hasAttribute('disabled'), false);
    assert.equal(attributes.isClassSet('active'), false);
    assert.equal(attributes.getProperty('color').value.blue, 255);
    assert.equal(attributes.getChild(0).getText(), 'Second & literal / 0');
    assert.equal(document.getElementById('if').getDisplay(),
      rmlui.StyleDisplay.None);
    assert.equal(document.getElementById('visible')
      .getComputedValues().visibility, rmlui.Style.Visibility.Hidden);
    assert.equal(document.getElementById('inserted'), null);
    assert.equal(document.getElementById('replacement').innerRML, 'Changed');
    model.applyPatch({ '$.enabled': true });
    context.update();
    assert.equal(document.getElementById('if').getLocalProperty('display'),
      null);
    assert.equal(document.getElementById('visible')
      .getLocalProperty('visibility'), null);
  },

  'value-checked-and-event-controllers-use-native-controls': ({ context }) => {
    const model = context.createDataModel('controls');
    model.bind('value', 7);
    model.bind('maximum', 10);
    model.bind('meal', true);
    model.bind('animal', 'dog');
    model.bind('option', 1);
    model.bind('text', 'initial');
    const document = load(context, 'controls', `
      <input id="range" type="range" min="0"
        data-value="value" data-attr-max="maximum"/>
      <input id="meal" type="checkbox" value="pizza" data-checked="meal"/>
      <input id="dog" type="radio" name="animal" value="dog"
        data-checked="animal"/>
      <input id="cat" type="radio" name="animal" value="cat"
        data-checked="animal"/>
      <select id="select" data-value="option">
        <option value="0">zero</option><option value="1">one</option>
      </select>
      <textarea id="text" data-value="text"/>
      <button id="assign" data-event-click="value = ev.amount; text = 'event'"/>
    `);
    const range = document.getElementById('range');
    assert.equal(Number(range.getValue()), 7);
    assert.equal(document.getElementById('meal').hasAttribute('checked'), true);
    assert.equal(document.getElementById('dog').hasAttribute('checked'), true);
    assert.equal(document.getElementById('cat').hasAttribute('checked'), false);
    assert.equal(document.getElementById('select').getValue(), '1');
    assert.equal(document.getElementById('text').getValue(), 'initial');
    document.getElementById('meal').click();
    assert.equal(model.getVariable('meal').get(), false);
    document.getElementById('cat').click();
    assert.equal(model.getVariable('animal').get(), 'cat');
    range.dispatchEvent('change', { value: 4 });
    assert.equal(model.getVariable('value').get(), 4);
    range.dispatchEvent('change', {
      value: 3, 'data-binding-override-value': 6,
    });
    assert.equal(model.getVariable('value').get(), 6);
    document.getElementById('select').dispatchEvent('change', { value: '0' });
    assert.equal(model.getVariable('option').get(), 0);
    document.getElementById('text').dispatchEvent('change',
      { value: 'edited' });
    assert.equal(model.getVariable('text').get(), 'edited');
    document.getElementById('assign').dispatchEvent('click', { amount: 9 });
    assert.equal(model.getVariable('value').get(), 9);
    assert.equal(model.getVariable('text').get(), 'event');
    model.applyPatch({ '$.value': 18, '$.maximum': 20 });
    context.update();
    assert.equal(Number(range.getValue()), 18,
      'max must update before value');
    assert.equal(document.getElementById('cat').hasAttribute('checked'), true);
    assert.equal(document.getElementById('dog').hasAttribute('checked'), false);
    assert.equal(document.getElementById('text').getValue(), 'event');
  },

  'nested-for-alias-shadows-and-late-controller-binding': ({ context }) => {
    const model = context.createDataModel('aliases',
      { allowMissingVariables: true });
    const types = model.getDataTypeRegister();
    const text = types.registerScalar('Text', 'string');
    const texts = types.registerArray('Texts', text);
    const record = types.registerStruct('Record');
    record.registerMember('title', text);
    record.registerMember('children', texts);
    const records = types.registerArray('Records', record);
    model.bind('roots', [
      { title: 'parent', children: [ 'one', 'two' ] },
    ], records);
    const document = load(context, 'aliases', `
      <input id="late" type="text" data-value="future"/>
      <section data-alias-items="roots">
        <article data-for="row, index : items" data-attr-title="row.title">
          <span>{{index}}:{{row.title}}</span>
          <label data-for="row : row.children">{{it_index}}:{{row}}</label>
        </article>
      </section>
    `);
    model.bind('future', 'late');
    model.dirtyVariable('future');
    context.update();
    const input = document.getElementById('late');
    assert.equal(input.getValue(), 'late');
    input.dispatchEvent('change', { value: 'written' });
    assert.equal(model.getVariable('future').get(), 'written');
    const article = document.querySelector('article[title]');
    assert.equal(article.getAttribute('title'), 'parent');
    assert.match(article.innerRML, /0:parent/);
    assert.match(article.innerRML, /0:one/);
    assert.match(article.innerRML, /1:two/);
    model.applyPatch({ '$.roots[0].children[1]': 'changed' });
    context.update();
    assert.match(article.innerRML, /1:changed/);
    model.getVariable('roots').resize(0);
    model.dirtyVariable('roots');
    context.update();
    assert.equal(document.querySelector('article[title]'), null);
  },

  'event-array-resize-is-synchronous-and-following-expressions-see-it':
    ({ context }) => {
      const model = context.createDataModel('mutation');
      model.bind('values', [ 1, 2 ], arraySchema(model, 'float64'));
      model.bind('subjects', [ 'first', 'second' ],
        arraySchema(model, 'string'));
      model.bind('length', 0);
      const values = model.getVariable('values');
      const old = values.getNumericView();
      const retained = values.child(1);
      model.bindEventCallback('append', handle => {
        values.resize(3);
        values.child(2).set(8);
        model.getVariable('subjects').resize(3);
        model.getVariable('subjects[2]').set('added');
        handle.dirtyVariable('values');
        handle.dirtyVariable('subjects');
        assert.equal(values.size, 3);
      });
      model.bindEventCallback('clear', handle => {
        values.resize(0);
        model.getVariable('subjects').resize(0);
        handle.dirtyVariable('values');
        handle.dirtyVariable('subjects');
      });
      const document = load(context, 'mutation', `
        <button id="append" data-event-click="append(); length = values.size"/>
        <button id="clear" data-event-click="clear(); length = values.size"/>
        <p data-for="v : values">{{it_index}}:{{v}}</p>
        <label data-for="s : subjects">{{s}}</label>
      `);
      document.getElementById('append').click();
      assert.equal(model.getVariable('length').get(), 3);
      assert.equal(retained.get(), 2);
      assert.deepEqual([ ...values.getNumericView() ], [ 1, 2, 8 ]);
      old[1] = 99;
      assert.equal(retained.get(), 2);
      context.update();
      assert.match(document.innerRML, /2:8/);
      assert.match(document.innerRML, /added/);
      document.getElementById('clear').click();
      assert.equal(model.getVariable('length').get(), 0);
      assert.throws(() => retained.get(), /path.*valid/i);
      context.update();
      assert.doesNotMatch(document.innerRML, /2:8|added/);
      assert.deepEqual([ ...old ], [ 1, 99 ]);
    },

  'getter-setter-transform-and-nested-listener-cannot-resize': env => {
    const { context } = env;
    const model = context.createDataModel('guard');
    model.bind('values', [ 1, 2 ], arraySchema(model, 'float64'));
    const values = model.getVariable('values');
    model.bindFunc('getter', () => {
      values.resize(0);
      return 1;
    });
    model.bindFunc('setter', () => 1, () => values.resize(0));
    model.registerTransformFunc('resize', () => {
      values.resize(0);
      return 1;
    });
    assert.throws(() => model.getVariable('getter').get(), /callback/i);
    assert.throws(() => model.getVariable('setter').set(1), /callback/i);
    assert.throws(() =>
      model.getDataTypeRegister().getTransformFuncRegister()
        .call('resize', []), /callback/i);
    model.bindEventCallback('check', (_handle, _event, args) => {
      if (args[0] === 'getter') {
        model.getVariable('getter').get();
      } else {
        model.getVariable('setter').set(1);
      }
    });
    const document = load(context, 'guard', `
      <button id="getter" data-event-click="check('getter')"/>
      <button id="setter" data-event-click="check('setter')"/>
      <button id="nested"/>
    `);
    document.getElementById('nested').addEventListener('click', () => {
      assert.throws(() => values.resize(0), /callback/i);
    });
    model.bindEventCallback('nested', () => {
      document.getElementById('nested').click();
      values.resize(3);
    });
    const button = document.createElement('button');
    button.setAttribute('data-event-click', 'nested()');
    document.appendChild(button);
    assert.throws(() => document.getElementById('getter').click(), /callback/i);
    assert.throws(() => document.getElementById('setter').click(), /callback/i);
    assert.equal(values.size, 2);
    button.click();
    assert.equal(values.size, 3);
    model.bindFunc('dispatching', () => {
      button.click();
      return 1;
    });
    assert.throws(() => model.getVariable('dispatching').get(), /callback/i);
    assert.equal(values.size, 3);
    // The forbidden getter/event nesting must not poison later data events.
    values.resize(2);
    button.click();
    assert.equal(values.size, 3);
  },

  'resize-first-error-and-recovery-preserve-native-storage': ({ context }) => {
    const model = context.createDataModel('errors');
    model.bind('values', [ 1, 2 ], arraySchema(model, 'float64'));
    model.bind('count', 0);
    const values = model.getVariable('values');
    const failure = new Error('after synchronous resize');
    let fail = true;
    let later = 0;
    model.bindEventCallback('resize', () => {
      values.resize(4);
      if (fail) {
        throw failure;
      }
    });
    model.bindEventCallback('later', () => ++later);
    const document = load(context, 'errors',
      '<button id="resize" data-event-click="resize(); later()"/>');
    assert.throws(() => document.getElementById('resize').click(),
      error => error === failure);
    assert.equal(values.size, 4);
    assert.equal(later, 0);
    fail = false;
    document.getElementById('resize').click();
    assert.equal(later, 1);
    values.resize(1);
    assert.equal(values.child(0).get(), 1);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Default data bindings');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({
      rmlui, context: rmlui.createContext('data-defaults', 320, 240),
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
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} default data binding failures`);
}
