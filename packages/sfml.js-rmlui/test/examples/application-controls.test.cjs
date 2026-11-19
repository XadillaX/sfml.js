'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cases = {
  'variables-launcher-matches-original-pixel-viewport': () => {
    const screenshot = path.join(
      os.tmpdir(), `rmlui-variables-viewport-${process.pid}.png`
    );

    try {
      const result = spawnSync(process.execPath, [
        path.resolve(__dirname, '../../examples/official.cjs'),
        'variables', '--frames', '2', '--screenshot', screenshot,
      ], { encoding: 'utf8', timeout: 25000 });

      assert.equal(result.status, 0, result.stdout + result.stderr);

      const image = fs.readFileSync(screenshot);
      assert.equal(image.readUInt32BE(16), 1024);
      assert.equal(image.readUInt32BE(20), 768);
    } finally {
      fs.rmSync(screenshot, { force: true });
    }
  },

  'effects-launcher-controls': () => {
    const result = spawnSync(process.execPath, [
      path.resolve(__dirname, '../../examples/official.cjs'),
      'effects', '--frames', '2', '--exercise',
    ], { encoding: 'utf8', timeout: 25000 });

    assert.equal(result.status, 0, result.stdout + result.stderr);
  },

  'variables-original-pixels-themes-and-accent': ({ context, rmlui }) => {
    const { createVariables } = require(
      '../../examples/official/basic/variables/main.cjs');
    const app = createVariables(context, { random: () => 0 });
    const key = rmlui.KeyIdentifier;
    context.setDensityIndependentPixelRatio(2);
    context.update();

    assert.equal(app.document.getProperty('width').unit, rmlui.Unit.PX);
    assert.equal(context.isThemeActive('dark'), true);
    app.processKey(key.KI_3, 0, 2, true);
    assert.equal(context.isThemeActive('dark'), false);
    assert.equal(context.isThemeActive('high-contrast'), true);
    app.processKey(key.KI_R, 0, 2, true);
    assert.equal(app.document.getLocalProperty('--accent').value,
      '#e31c1c');
    app.processKey(key.KI_2, 0, 2, true);
    assert.equal(context.isThemeActive('high-contrast'), false);
    assert.equal(app.document.getLocalProperty('--accent').value,
      '#e31c1c');
    app.processKey(key.KI_C, 0, 2, true);
    context.update();
    assert.equal(app.document.getLocalProperty('--accent').value,
      '#d35400');
    app.close();
  },

  'shell-priority-density-and-stylesheet-reload': ({ context, rmlui }) => {
    const { processKeyDownShortcuts } = require(
      '../../examples/official/shell/shortcuts.cjs');
    const key = rmlui.KeyIdentifier;
    const ctrl = rmlui.KeyModifier.KM_CTRL;
    const processKey = (code, modifiers = ctrl, priority = true) =>
      processKeyDownShortcuts(context, code, modifiers, 2, priority);

    assert.ok(rmlui.Debugger.initialise(context));
    context.update();
    assert.equal(processKey(key.KI_F8, 0), false);
    context.update();
    assert.equal(rmlui.Debugger.isVisible(), true);
    processKey(key.KI_F8, 0);
    context.update();
    assert.equal(rmlui.Debugger.isVisible(), false);
    processKey(key.KI_1);
    assert.equal(context.densityIndependentPixelRatio, 1);
    processKey(key.KI_OEM_PLUS);
    assert.ok(Math.abs(context.densityIndependentPixelRatio - 1.2) < 1e-6);
    processKey(key.KI_SUBTRACT);
    assert.ok(Math.abs(context.densityIndependentPixelRatio - 1) < 1e-6);
    processKey(key.KI_0);
    assert.equal(context.densityIndependentPixelRatio, 2);
    assert.equal(processKey(key.KI_R), true);

    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-reload-'));
    try {
      const style = path.join(directory, 'style.rcss');
      const source = path.join(directory, 'reload.rml');
      fs.writeFileSync(style, 'body { background-color: red; }');
      fs.writeFileSync(source, '<rml><head>' +
        '<link type="text/rcss" href="style.rcss"/>' +
        '</head><body/></rml>');
      const document = context.loadDocument(source);
      document.show();
      context.update();
      assert.equal(document.getProperty('background-color').value.red, 255);
      fs.writeFileSync(style, 'body { background-color: green; }');
      assert.equal(processKey(key.KI_R, ctrl, false), false);
      context.update();
      assert.equal(document.getProperty('background-color').value.red, 0);
      assert.equal(document.getProperty('background-color').value.green, 128);
      assert.equal(processKey(key.KI_SPACE, 0, false), true);
    } finally {
      fs.rmSync(directory, { recursive: true });
    }
  },

  'basic-drag-transfer-and-both-reorder-directions': ({ context }) => {
    const { createDrag } = require(
      '../../examples/official/basic/drag/main.cjs');
    const app = createDrag(context);
    const [ first, second ] = app.documents.map(document =>
      document.getElementById('content'));
    const items = first.querySelectorAll('icon');
    assert.equal(items.length, 4);

    second.dispatchEvent('dragdrop', { drag_element: items[0] });
    assert.equal(items[0].getParentNode(), second);
    assert.equal(first.querySelectorAll('icon').length, 3);
    items[2].dispatchEvent('dragdrop', { drag_element: items[0] });
    assert.deepEqual(first.querySelectorAll('icon'),
      [ items[1], items[0], items[2], items[3] ]);
    items[3].dispatchEvent('dragdrop', { drag_element: items[1] });
    assert.deepEqual(first.querySelectorAll('icon'),
      [ items[0], items[2], items[3], items[1] ]);
    items[0].dispatchEvent('dragdrop', { drag_element: items[1] });
    assert.deepEqual(first.querySelectorAll('icon'),
      [ items[1], items[0], items[2], items[3] ]);
    app.close();
    assert.equal(context.getNumDocuments(), 0);
  },

  'tutorial-inventories-original-items-and-no-transfer-listener':
    ({ context }) => {
      const { createDragTutorial } = require(
        '../../examples/official/tutorial/drag/main.cjs');
      const app = createDragTutorial(context);
      const [ first, second ] = app.documents;
      assert.equal(first.getElementById('title').innerRML, 'Inventory 1');
      assert.equal(second.getElementById('title').innerRML, 'Inventory 2');
      const items = first.querySelectorAll('icon');
      assert.deepEqual(items.map(item => item.innerRML), [
        'Mk III L.A.S.E.R.', 'Gravity Descender',
        'Closed-Loop Ion Beam', '5kT Mega-Bomb',
      ]);
      second.getElementById('content')
        .dispatchEvent('dragdrop', { drag_element: items[0] });
      assert.equal(items[0].getOwnerDocument(), first);
      assert.equal(second.querySelectorAll('icon').length, 0);
      assert.equal(first.getProperty('left').value, 50);
      assert.equal(second.getProperty('top').value, 240);
      app.close();
    },

  'transform-updates-after-render-with-pause-and-original-rate':
    ({ context, rmlui }) => {
      const { createTransform } = require(
        '../../examples/official/basic/transform/main.cjs');
      const app = createTransform(context);
      const recorded = [];
      const present = () => recorded.push(app.documents[0]
        .getLocalProperty(rmlui.PropertyId.Transform)?.toString() ?? '');

      app.frame(10, present);
      app.frame(11, present);
      assert.equal(recorded[0], '');
      assert.match(recorded[1], /0deg/);
      assert.match(app.documents[0]
        .getLocalProperty(rmlui.PropertyId.Transform).toString(),
      /50deg/);
      assert.match(app.documents[1]
        .getLocalProperty(rmlui.PropertyId.Transform).toString(),
      /perspective\(800dp\)/);
      context.getRootElement().dispatchEvent('keydown', {
        key_identifier: rmlui.KeyIdentifier.KI_SPACE,
      });
      app.frame(12, present);
      assert.match(app.documents[0]
        .getLocalProperty(rmlui.PropertyId.Transform).toString(),
      /50deg/);
      context.getRootElement().dispatchEvent('keydown', {
        key_identifier: rmlui.KeyIdentifier.KI_SPACE,
      });
      app.frame(13, present);
      assert.match(app.documents[0]
        .getLocalProperty(rmlui.PropertyId.Transform).toString(),
      /100deg/);
      app.close();
    },

  'effects-real-controls-and-submenu-scoped-reset': ({ context }) => {
    const { createEffects } = require(
      '../../examples/official/basic/effects/main.cjs');
    const app = createEffects(context);
    const doc = app.document;
    context.update();
    doc.getElementById('menu_button').click();
    context.update();
    assert.equal(app.model.getVariable('show_menu').get(), true);
    doc.querySelector('input[data-value="opacity"]')
      .dispatchEvent('change', { value: 0.25 });
    doc.querySelector('input[data-value="blur"]')
      .dispatchEvent('change', { value: 8 });
    context.update();
    assert.equal(app.model.getVariable('opacity').get(), 0.25);
    assert.match(doc.querySelector('.filter').getProperty('filter').toString(),
      /blur\(8px\)/);
    doc.querySelector('[data-event-click="submenu = \'transform\'"]').click();
    context.update();
    doc.querySelector('input[data-value="scale"]')
      .dispatchEvent('change', { value: 1.5 });
    doc.querySelector('button[data-event-click="reset()"]').click();
    assert.equal(app.model.getVariable('scale').get(), 1);
    assert.equal(app.model.getVariable('opacity').get(), 0.25);
    doc.querySelector('[data-event-click="submenu = \'filter\'"]').click();
    context.update();
    doc.querySelector('button[data-event-click="reset()"]').click();
    assert.equal(app.model.getVariable('opacity').get(), 1);
    assert.equal(app.model.getVariable('blur').get(), 0);
    assert.equal(app.model.getVariable('show_menu').get(), true);
    app.close();
  },

  'svg-toggle-all-three-original-data-paths': ({ context }) => {
    const { createSvg } = require(
      '../../examples/official/basic/svg/main.cjs');
    const app = createSvg(context);
    context.update();
    assert.equal(app.documents.length, 3);
    const inline = app.documents[2];
    for (const color of [ 'green', 'red' ]) {
      inline.querySelector('button').click();
      context.update();
      assert.equal(app.model.getVariable('fill_color').get(), color);
      for (const svg of inline.querySelectorAll('svg')) {
        assert.match(svg.innerRML, new RegExp(`fill="${color}"`));
      }
    }
    assert.equal(app.documents[0].getElementById('title').innerRML,
      'SVG Element');
    app.close();
    assert.equal(context.getNumDocuments(), 0);
  },
};

async function run(name) {
  if (name.endsWith('-controls')) {
    cases[name]();
    return;
  }

  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(1600, 950)), 'Official controls',
    { settings: { stencilBits: 8 } });
  try {
    assert.ok(rmlui.initialise(window, {
      highDpi: false,
      fileRoot: path.resolve(__dirname, '../../third_party/rmlui/Samples'),
    }));
    rmlui.getSystemInterface().clock[0] = 0;
    assert.ok(rmlui.loadFontFace('/assets/LatoLatin-Regular.ttf'));
    const context = rmlui.createContext('official-controls-tests', 1600, 950);
    await cases[name]({ rmlui, context });
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
      encoding: 'utf8', timeout: 30000,
    });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} application control failures`);
}
