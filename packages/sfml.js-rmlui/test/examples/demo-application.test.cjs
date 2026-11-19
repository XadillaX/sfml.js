'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cases = {
  'original-sandbox-document-and-styles': ({ app, context }) => {
    const document = app.document;
    const source = document.getElementById('sandbox_rml_source');
    const outerColor = document.getProperty('color').value;
    assert.equal(document.getElementById('title').innerRML, 'Demo sample');
    assert.equal(source.getValue(),
      '<p>Write your RML here</p>\n\n' +
      '<!-- <img src="assets/high_scores_alien_1.tga"/> -->');
    assert.equal(context.getNumDocuments(), 1);
    assert.equal(app.iframe.getParentNode(),
      document.getElementById('sandbox_target'));
    assert.equal(app.iframe.getOwnerDocument(), app.iframe);
    assert.equal(app.iframe.getContext(), context);
    assert.equal(app.iframe.innerRML, '<p>Rendered output goes here.</p>');

    document.getElementById('menu').setActiveTab(5);
    source.setValue('<p id="inside">Hello &amp; native sandbox</p>');
    source.dispatchEvent('change');
    const style = document.getElementById('sandbox_rcss_source');
    style.setValue('body { color: #fea; background: #224; } ' +
      '#inside { font-size: 21px; }');
    style.dispatchEvent('change');
    app.beforeEvents();
    context.update();
    const inside = app.iframe.getElementById('inside');
    assert.ok(inside);
    assert.equal(inside.getProperty('font-size').value, 21);
    assert.equal(app.iframe.getProperty('position').toString(), 'absolute');
    assert.equal(app.iframe.getProperty('overflow-y').toString(), 'auto');
    assert.deepEqual(app.iframe.getProperty('color').value, {
      type: 'colourb', red: 255, green: 238, blue: 170, alpha: 255,
    });
    assert.deepEqual(document.getProperty('color').value, outerColor);
    app.close();
    context.update();
    assert.equal(context.getNumDocuments(), 0);
    assert.throws(() => inside.getContext(), /expired|valid|destroyed/i);
  },

  'original-form-encoding-and-four-second-progress':
    ({ app, context, clock }) => {
      const document = app.document;
      document.getElementById('menu').setActiveTab(4);
      document.querySelector('input[name="name"]').setValue('<N & M>');
      document.querySelector('textarea[name="message"]')
        .setValue('<script>& "hello"</script>');
      document.querySelector('input[type="submit"]').click();
      assert.equal(app.submitting, true);
      assert.equal(document.getElementById('form_output').innerRML, '');
      assert.equal(document.getElementById('submit_progress')
        .getLocalProperty('display').toString(), 'block');

      const expected = [
        [ 0, 0.09, 0, '0 %', '0 %', 'Placing tubes' ],
        [ 1, 0.5, 0, '50 %', '0 %', 'Placing tubes.' ],
        [ 2, 0.91, 0, '100 %', '0 %', 'Placing tubes..' ],
        [ 3, 0.91, 0.5, '100 %', '50 %',
          'Placing tubes... Placed! Assembling message...' ],
        [ 4, 0.91, 1, '100 %', '100 %',
          'Placing tubes... Placed! Assembling message... Done!' ],
      ];
      for (const row of expected) {
        const [ time, gauge, horizontal, gaugeText, text, label ] = row;
        clock[0] = time;
        app.beforeEvents();
        context.update();
        assert.ok(Math.abs(Number(document.getElementById('gauge')
          .getAttribute('value')) - gauge) < 1e-6);
        const horizontalElement = document
          .getElementById('progress_horizontal');
        assert.ok(Math.abs(horizontalElement.getAttribute('value', 0) -
          horizontal) < 1e-6);
        assert.equal(document.getElementById('gauge_value').innerRML,
          gaugeText);
        assert.equal(document.getElementById('progress_value').innerRML, text);
        assert.equal(document.getElementById('progress_label').innerRML, label);
      }
      assert.equal(app.submitting, false);
      const output = document.getElementById('form_output');
      assert.equal(output.querySelector('script'), null);
      assert.match(output.innerRML, /&lt;N &amp; M&gt;/);
      assert.match(output.innerRML, /<strong>message<\/strong>: <br \/>/);
      assert.match(output.innerRML, /&lt;script&gt;&amp;/);
      assert.match(output.innerRML, /<strong>animal<\/strong>: dog/);
      assert.match(output.innerRML,
        /<strong>meals<\/strong>: pizza, pasta, lasagne/);
      clock[0] = 10;
      document.querySelector('input[type="submit"]').click();
      assert.equal(output.innerRML, '');
      app.beforeEvents();
      assert.equal(document.getElementById('gauge_value').innerRML, '0 %');
      app.close();
    },

  'original-rating-thresholds': ({ app }) => {
    const document = app.document;
    const input = document.querySelector('input[name="rating"]');
    for (const [ value, emoji ] of [
      [ -1, '😢' ], [ 0, '😢' ], [ 1, '😐' ], [ 49, '😐' ],
      [ 50, '😮' ], [ 74, '😮' ], [ 75, '😎' ], [ 99, '😎' ],
      [ 100, '🏆' ], [ 101, '🏆' ],
    ]) {
      input.dispatchEvent('change', { value });
      assert.equal(document.getElementById('rating').innerRML, `${value}%`);
      assert.equal(document.getElementById('rating_emoji').innerRML, emoji);
    }
    app.close();
  },

  'original-tweens-geometry-and-click-propagation':
    ({ app, context, rmlui, clock }) => {
      const document = app.document;
      document.getElementById('menu').setActiveTab(3);
      context.update();
      const duration = document
        .querySelector('#animations input[type="range"]');
      const functionControl = document
        .querySelector('[name="tween_function"]');
      const directionControl = document
        .querySelector('[name="tween_direction"]');
      for (const name of [
        'back', 'bounce', 'circular', 'cubic', 'elastic', 'exponential',
        'linear', 'quadratic', 'quartic', 'quintic', 'sine',
      ]) {
        functionControl.dispatchEvent('change', { value: name });
        assert.equal(app.getTweeningParameters().type,
          rmlui.TweenType[name[0].toUpperCase() + name.slice(1)]);
      }
      for (const [ name, direction ] of [
        [ 'in', rmlui.TweenDirection.In ], [ 'out', rmlui.TweenDirection.Out ],
        [ 'in-out', rmlui.TweenDirection.InOut ],
      ]) {
        directionControl.dispatchEvent('change', { value: name });
        assert.equal(app.getTweeningParameters().direction, direction);
      }
      duration.setValue('0');
      duration.dispatchEvent('change');
      assert.equal(document.getElementById('duration').innerRML, '0.00');
      const area = document.getElementById('tweening_area');
      const child = area.getFirstChild();
      const offset = area.getAbsoluteOffset();
      area.dispatchEvent('click', { mouse_x: offset.x + 100,
        mouse_y: offset.y + 90 });
      const transform = child.getLocalProperty('transform').value.primitives[0];
      assert.equal(transform.type, rmlui.TransformPrimitiveType.TRANSLATE2D);
      assert.ok(Math.abs(transform.values[0].number -
        (100 - 0.35 * child.clientWidth)) < 1e-5);
      assert.ok(Math.abs(transform.values[1].number -
        (90 - 0.9 * child.clientHeight)) < 1e-5);

      duration.setValue('0.5');
      duration.dispatchEvent('change');
      child.click();
      // Upstream ElementAnimation clamps each update to 0.1 seconds.
      for (let frame = 0; frame < 7; frame++) {
        clock[0] += 0.1;
        context.update();
      }
      assert.equal(document.getElementById('duration').innerRML, '0.50');
      const color = child.getProperty('image-color').value;
      assert.deepEqual([ color.red, color.green, color.blue ], [ 0, 0, 0 ]);
      assert.deepEqual(child.getLocalProperty('transform').value.primitives[0],
        transform);
      app.close();
    },

  'escape-cancels-open-select-before-exit': options => {
    const { app, context, rmlui, exits } = options;
    const document = app.document;
    document.getElementById('menu').setActiveTab(4);
    context.update();
    const select = document.querySelector('select[name="subject"]');
    select.showSelectBox();
    assert.equal(select.isSelectBoxVisible(), true);
    const event = { key_identifier: rmlui.KeyIdentifier.KI_ESCAPE };
    select.dispatchEvent('keydown', event);
    assert.equal(select.isSelectBoxVisible(), false);
    assert.equal(exits.length, 0);
    select.dispatchEvent('keydown', event);
    assert.equal(exits.length, 1);
    app.close();
  },

  'native-original-application-reference': ({ app, context, clock }) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-demo-'));
    try {
      let referenceFile = process.env.RMLUI_DEMO_REFERENCE;
      if (!referenceFile) {
        const result = spawnSync('python3', [
          path.join(__dirname,
            '../native/examples/basic/demo/build-original-application.py'),
          directory,
        ], { encoding: 'utf8', timeout: 90000 });
        assert.equal(result.status, 0, result.stdout + result.stderr);
        referenceFile = path.join(directory, 'original-demo-reference.json');
      }
      const reference = JSON.parse(fs.readFileSync(referenceFile, 'utf8'));
      const document = app.document;
      document.querySelector('input[name="name"]').setValue('<N & M>');
      document.querySelector('textarea[name="message"]')
        .setValue('<script>& "hello"</script>');
      document.querySelector('input[type="submit"]').click();
      for (const row of reference.frames) {
        const [ time, gauge, horizontal, gaugeText, text, label ] = row;
        clock[0] = time;
        app.beforeEvents();
        context.update();
        assert.ok(Math.abs(document.getElementById('gauge')
          .getAttribute('value', 0) - gauge) < 1e-7, `native gauge at ${time}`);
        const element = document.getElementById('progress_horizontal');
        assert.ok(Math.abs(element.getAttribute('value', 0) -
          horizontal) < 1e-7, `native horizontal at ${time}`);
        assert.equal(document.getElementById('gauge_value').innerRML,
          gaugeText);
        assert.equal(document.getElementById('progress_value').innerRML, text);
        assert.equal(document.getElementById('progress_label').innerRML, label);
      }
      assert.equal(document.getElementById('form_output').innerRML,
        reference.formOutput);
      app.close();
    } finally {
      fs.rmSync(directory, { recursive: true });
    }
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const { createDemo } = require('../../examples/official/basic/demo/main.cjs');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(1600, 890)), 'Original Demo controls',
    { settings: { stencilBits: 8 } });
  try {
    assert.ok(rmlui.initialise(window, {
      highDpi: false,
      fileRoot: path.resolve(__dirname, '../../third_party/rmlui/Samples'),
    }));
    const clock = rmlui.getSystemInterface().clock;
    clock[0] = 0;
    assert.ok(rmlui.loadFontFace('/assets/LatoLatin-Regular.ttf'));
    assert.ok(rmlui.loadFontFace('/assets/NotoEmoji-Regular.ttf', true));
    const context = rmlui.createContext('demo-tests', 1600, 890);
    const exits = [];
    const app = createDemo(context, {
      requestExit: () => exits.push(true), random: () => 0,
    });
    context.update();
    await cases[name]({ app, context, clock, rmlui, exits });
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
    if (name === 'native-original-application-reference' &&
        process.platform !== 'darwin') {
      console.log(`SKIP ${name}: existing macOS vendor build required`);
      continue;
    }
    const result = spawnSync(process.execPath, [ __filename, name ], {
      encoding: 'utf8', timeout: 100000,
    });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} original demo failures`);
}
