'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { parseArgs } = require('node:util');
const sfml = require('sfml.js');
const rmlui = require('../dist');

const width = 760;
const height = 480;

function createPanel(context) {
  const model = context.createDataModel('application');
  assert.ok(model);
  let factoryView;
  let factoryTitleView;
  let factoryController;
  let releasedViews = 0;
  rmlui.Factory.registerDataViewInstancer(
    new rmlui.DataViewInstancer(element => {
      let root = '';
      factoryView = new rmlui.DataView(element, {
        initialize(_current, _attached, expression) {
          root = expression;
          return true;
        },
        update(current) {
          const label = `Factory view: ${current.getVariable(root).get()}`;
          if (element.innerRML === label) {
            return false;
          }
          element.innerRML = label;
          return true;
        },
        getVariableNameList: () => [ root ],
        release() {
          ++releasedViews;
        },
      }, -10);
      return factoryView;
    }), 'host');
  rmlui.Factory.registerDataViewInstancer(
    new rmlui.DataViewInstancer(element => {
      factoryTitleView = rmlui.Factory.instanceDataView('value', element);
      return factoryTitleView;
    }), 'hostvalue');
  rmlui.Factory.registerDataControllerInstancer(
    new rmlui.DataControllerInstancer(element => {
      factoryController = rmlui.Factory.instanceDataController(
        'value', element);
      return factoryController;
    }), 'hostvalue');
  model.bind('count', 1);
  model.bindCustomDataVariable('count_alias', model.getVariable('count'));
  model.bindCustomDataVariable('constant', rmlui.makeLiteralIntVariable(-7));
  assert.equal(new rmlui.DataModelConstructor().isValid, false);
  model.bind('details', true);
  const status = model.registerEnum('Status', 'uint8');
  model.bind('status', 2, status);
  const label = model.registerScalar('StatusLabel', {
    get: payload => [ 'idle', 'ready', 'done' ][payload.code],
    set: (payload, value) => {
      payload.code = [ 'idle', 'ready', 'done' ].indexOf(String(value));
    },
  });
  model.bindCustomDataVariable('status_label', { code: 1 }, label);
  const quote = model.registerCustomDataVariableDefinition('Quote', {
    type: rmlui.DataVariableType.Scalar,
    get: payload => ({ success: true, value: payload.amount }),
    set: (payload, value) => {
      if (typeof value !== 'number') {
        return false;
      }
      payload.amount = value;
      return true;
    },
  });
  model.bindCustomDataVariable('quote', { amount: 4 }, quote);
  const types = model.getDataTypeRegister();
  const real = types.registerScalar('Real', 'float64');
  const text = types.registerScalar('Text', 'string');
  const item = types.registerStruct('Item');
  const items = types.registerArray('Items', item);
  item.registerMember('name', text);
  item.registerMember('price', real);
  item.registerMember('double_price', real,
    parent => Number(parent.child('price').get()) * 2,
    (parent, value) => parent.child('price').set(Number(value) / 2));
  item.registerMember('children', items);
  model.bind('items', [{
    name: 'Fruit', price: 2.5,
    children: [{ name: 'Apple', price: 1.5, children: [] }],
  }], items);
  const itemRef = types.registerReference('ItemRef', item);
  model.bind('selected', model.getVariable('items[0]'), itemRef);
  const priceAddress = [
    new rmlui.DataAddressEntry('items'), new rmlui.DataAddressEntry(0),
    new rmlui.DataAddressEntry('price'),
  ];
  assert.equal(model.getVariable(priceAddress).getDefinition(), real);
  assert.equal(model.getAllVariables().items.getDefinition(), items);
  const samples = types.registerArray('Samples', real);
  model.bind('samples', new Float64Array([ 1, 2, 3 ]), samples);
  let title = 'Native data models';
  model.bindFunc('title', () => title, value => {
    title = String(value);
  });
  model.bindFunc('doubled', () => Number(model.getVariable('count').get()) * 2);
  model.bindFunc('accent', () => ({
    type: 'colourb', red: 165, green: 213, blue: 205, alpha: 255,
  }));
  const transforms = types.getTransformFuncRegister();
  transforms.register('label', args => `${args[0]} updates`);
  transforms.register('coordinates', args => ({ x: args[0], y: args[1] }));
  assert.deepEqual(transforms.call('coordinates', [ 3, 4 ]),
    { success: true, value: { x: 3, y: 4 } });
  model.bindEventCallback('increment', handle => {
    const count = model.getVariable('count');
    count.set(Number(count.get()) + 1);
    handle.dirtyVariable('count');
    handle.dirtyVariable('count_alias');
    handle.dirtyVariable('doubled');
  });
  const document = context.loadDocumentFromMemory(`
<rml>
<head><style>
body { width:760px; height:480px; margin:0; padding:0;
  font-family:LatoLatin; font-size:18px; color:#d4ddea;
  background:#161e2a; }
div { display:block; }
#heading { position:absolute; left:32px; top:28px;
  color:white; font-size:30px; }
#intro { position:absolute; left:32px; top:76px; color:#93a5b9; }
#factory-status { font-size:15px; color:#a5d5cd; }
.panel { position:absolute; left:32px; width:696px;
  background:#223147; border:1px #496077; border-radius:12px; }
#counter { top:126px; height:110px; }
#count { position:absolute; left:22px; top:12px;
  font-size:36px; color:white; }
#doubled { position:absolute; left:24px; top:72px; color:#a5d5cd; }
button { position:absolute; right:22px; top:32px;
  padding:12px 20px; background:#43607e; border:1px #7191ac;
  border-radius:6px; color:white; }
button:hover { background:#54799e; }
#edit { top:256px; height:98px; }
.label { position:absolute; left:22px; top:16px; color:white; }
input[type=text] { position:absolute; left:22px; top:46px;
  width:610px; height:25px; padding:5px 10px;
  background:#161e2a; border:1px #7191ac; border-radius:5px;
  color:white; }
#detail-toggle { position:absolute; left:34px; top:382px; }
input[type=checkbox] { width:18px; height:18px;
  background:#161e2a; border:1px #7191ac; border-radius:3px; }
input[type=checkbox]:checked { background:#a5d5cd; }
#detail-label { position:absolute; left:64px; top:380px; }
#details { position:absolute; left:34px; top:414px;
  width:692px; font-size:15px; color:#93a5b9; }
.inventory-item { display:inline-block; margin-right:8px; }
</style></head>
<body data-model="application">
  <div id="heading">{{title}}</div>
  <div id="intro">
    Native expressions · Dirty roots · Two-way controls · State {{status}}
    <div id="factory-status" data-host="count"/>
  </div>
  <div class="panel" id="counter">
    <div id="count">{{count | label}}</div>
    <div id="doubled" data-style-color="accent">
      Read-only getter: {{doubled}}
    </div>
    <button id="increment" data-event-click="increment()">Increment</button>
  </div>
  <div class="panel" id="edit">
    <div class="label">Edit the bound title</div>
    <input id="title-input" type="text" data-hostvalue="title"/>
  </div>
  <input id="detail-toggle" type="checkbox" data-checked="details"/>
  <div id="detail-label">Show structured native storage</div>
  <div id="details" data-visible="details">
    <span class="inventory-item" data-for="item : items">
      {{item.name}}: {{item.price}}
      <span data-for="child : item.children">/ {{child.name}}</span>
    </span>
    <span id="sample-count">Shared values: {{samples.size}}</span>
    <span id="sample-first">· First: {{samples[0]}}</span>
    <span>· Escape: exit</span>
    <div id="selected">
      Managed selection: {{selected.name}} · Custom quote: {{quote}}
    </div>
    <div id="accessors">
      Getter total: {{items[0].double_price}} ·
      Scalar label: {{status_label}} · Alias: {{count_alias}} ·
      Constant: {{constant}}
    </div>
  </div>
</body>
</rml>`);
  document.show();
  return {
    model, document, factoryView, factoryTitleView, factoryController,
    releasedViews: () => releasedViews,
  };
}

async function run(frameLimit, screenshot, exercise) {
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(width, height)), 'Native data models',
    { settings: { stencilBits: 8 } });
  window.setFramerateLimit(60);
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
    const context = rmlui.createContext('data-models', width, height);
    const panel = createPanel(context);
    const { model, document } = panel;
    let running = true;
    let increments = 0;
    const samples = model.getVariable('samples');
    const originalSamples = samples.getNumericView();
    for (let frame = 0;
      running && window.isOpen() && frame < frameLimit; ++frame) {
      let event;
      while ((event = window.pollEvent()) !== undefined) {
        if (event.is('Closed') ||
            (event.is('KeyPressed') &&
             event.data.code === sfml.Keyboard.Key.Escape)) {
          running = false;
        }
        context.processEvent(event);
      }
      if (!running) {
        break;
      }
      if (exercise && frame === 2) {
        samples.resize(4);
        const view = samples.getNumericView();
        view[0] = 7;
        model.dirtyVariable('samples');
        assert.equal(originalSamples[0], 1);
        model.applyPatch({ '$.items[0].price': 3 });
        assert.equal(model.getVariable('items[0].double_price').get(), 6);
        assert.equal(model.getVariable('status_label').set('done'), true);
        model.dirtyVariable('status_label');
        const selected = model.getVariable('selected');
        selected.setReference(null);
        assert.equal(selected.getReference(), null);
        selected.setReference(model.getVariable('items[0].children[0]'));
        model.dirtyVariable('selected');
        assert.equal(model.getVariable('quote').set(5), true);
        model.dirtyVariable('quote');
        assert.equal(model.getVariable('status').set(3), true);
        assert.equal(model.getVariable('status').set(256), false);
        model.dirtyVariable('status');
      }
      if (exercise && frame > 0 && frame % 3 === 0) {
        document.getElementById('increment').click();
        ++increments;
        document.getElementById('title-input').dispatchEvent('change',
          { value: 'Native updates verified' });
      }
      context.update();
      if (exercise) {
        assert.equal(model.getVariable('count').get(), 1 + increments);
        assert.equal(model.getVariable('doubled').get(), (1 + increments) * 2);
        assert.deepEqual(document.getElementById('doubled')
          .getProperty('color').value, model.getVariable('accent').get());
        assert.match(document.getElementById('count').innerRML,
          new RegExp(`${1 + increments} updates`));
        assert.equal(document.getElementById('factory-status').innerRML,
          `Factory view: ${1 + increments}`);
        if (increments > 0) {
          assert.match(document.getElementById('heading').innerRML,
            /Native updates verified/);
          assert.equal(document.getElementById('title-input')
            .getAttribute('value'), 'Native updates verified');
        }
        assert.match(document.getElementById('details').innerRML, /Fruit/);
        assert.match(document.getElementById('details').innerRML, /Apple/);
        if (frame >= 2) {
          assert.equal(model.getVariable('items[0].price').get(), 3);
          assert.match(document.getElementById('sample-count').innerRML,
            /Shared values: 4/);
          assert.match(document.getElementById('sample-first').innerRML,
            /First: 7/);
          assert.match(document.getElementById('selected').innerRML,
            /Managed selection: Apple/);
          assert.match(document.getElementById('selected').innerRML,
            /Custom quote: 5/);
          assert.match(document.getElementById('intro').innerRML,
            /State 3/);
        }
      }
      window.clear(sfml.Color.Black);
      window.flush();
      context.render();
      if (screenshot && frame === frameLimit - 1) {
        window.flush();
        const texture = new sfml.Texture(new sfml.Vector2u(width, height));
        texture.update(window);
        const image = texture.copyToImage();
        assert.ok(image.pixels.some((byte, index) =>
          index % 4 !== 3 && byte > 100));
        assert.ok(await image.saveToFile(screenshot));
      }
      window.display();
    }
    const retained = model.getVariable('count');
    context.remove();
    assert.equal(panel.factoryView.isValid, false);
    assert.equal(panel.factoryTitleView.isValid, false);
    assert.equal(panel.factoryController.isValid, false);
    assert.equal(panel.releasedViews(), 1);
    assert.equal(model.isValid, false);
    assert.throws(() => retained.get(), /model.*valid/i);
    assert.deepEqual(Array.from(originalSamples), [ 1, 2, 3 ]);
    console.log('Verified native scalar views, getter/transform evaluation, ' +
      'event-driven dirty roots, two-way title input, recursive data-for, ' +
      'shared buffers, array resize, sparse patches, owned Variant colour, ' +
      'direct native transforms, nullable managed selection, checked enums, ' +
      'custom native definitions, member accessors, scalar type callbacks, ' +
      'checked aliases, native Factory view scheduling, ' +
      'default controller delegation and ' +
      'removal invalidation');
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

const { values } = parseArgs({
  options: {
    frames: { type: 'string' },
    screenshot: { type: 'string' },
    exercise: { type: 'boolean', default: false },
  },
});
const frameLimit = values.frames === undefined
  ? Infinity : Number(values.frames);
if (values.frames !== undefined &&
    (!Number.isSafeInteger(frameLimit) || frameLimit < 1)) {
  throw new Error('--frames must be a positive integer');
}
run(frameLimit, values.screenshot, values.exercise).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
