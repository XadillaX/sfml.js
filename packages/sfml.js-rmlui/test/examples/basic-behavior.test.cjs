'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const cases = {
  'animation-launcher-exercises-original-controls': () => {
    const result = spawnSync(process.execPath, [
      path.resolve(__dirname, '../../examples/official.cjs'),
      'animation', '--frames', '2', '--exercise',
    ], { encoding: 'utf8', timeout: 20000 });

    assert.equal(result.status, 0, result.stdout + result.stderr);
  },

  'animation-pause-single-frame-fade-and-nudge': ({ rmlui, context }) => {
    const { createAnimation } = require(
      '../../examples/official/basic/animation/main.cjs');
    const app = createAnimation(context, { random: () => 0 });
    const key = rmlui.KeyIdentifier;
    const help = app.document.getElementById('help');
    let presentations = 0;
    const present = () => presentations++;

    app.frame(0, present);
    app.document.dispatchEvent('keydown', { key_identifier: key.KI_SPACE });
    app.frame(1.4, present);
    assert.equal(presentations, 1);
    assert.equal(help.isClassSet('fadeout'), false);

    app.document.dispatchEvent('keydown', { key_identifier: key.KI_RETURN });
    app.frame(1.4, present);
    assert.equal(presentations, 2);
    assert.equal(help.isClassSet('fadeout'), true);
    app.frame(2.8, present);
    assert.equal(presentations, 2);
    assert.equal(help.isClassSet('fadein'), false);

    const exit = app.document.getElementById('exit');
    app.document.dispatchEvent('keydown', { key_identifier: key.KI_OEM_PLUS });
    app.frame(2.8, present);
    assert.ok(Math.abs(exit.getProperty('margin-left').value - 0.3) < 1e-6);
    app.document.dispatchEvent('keydown', { key_identifier: key.KI_OEM_MINUS });
    app.frame(2.8, present);
    assert.equal(exit.getProperty('margin-left').value, 0);

    app.document.dispatchEvent('keydown', { key_identifier: key.KI_SPACE });
    app.frame(2.8, present);
    assert.equal(help.isClassSet('fadeout'), false);
    assert.equal(help.isClassSet('fadein'), true);
    app.frame(4.2, present);
    assert.equal(help.isClassSet('fadein'), false);
    assert.equal(help.isClassSet('textalign'), true);
    app.close();
    assert.equal(context.getNumDocuments(), 0);
  },

  'animation-inline-click-arrows-and-native-animationend':
    ({ rmlui, context, system }) => {
      const { createAnimation } = require(
        '../../examples/official/basic/animation/main.cjs');
      let exits = 0;
      const app = createAnimation(context, {
        random: () => 0.5, requestExit: () => exits++,
      });
      const transition = app.document.getElementById('transition_class');
      transition.click();
      assert.equal(transition.isClassSet('move_me'), true);
      transition.click();
      assert.equal(transition.isClassSet('move_me'), false);

      const response = app.document.getElementById('keyevent_response');
      for (const [ key, expected ] of [
        [ rmlui.KeyIdentifier.KI_LEFT, -200 ],
        [ rmlui.KeyIdentifier.KI_RIGHT, 200 ],
        [ rmlui.KeyIdentifier.KI_UP, 0 ],
        [ rmlui.KeyIdentifier.KI_DOWN, 0 ],
      ]) {
        app.document.dispatchEvent('keydown', { key_identifier: key });
        for (let frame = 0; frame < 7; frame++) {
          system.clock[0] += 0.1;
          context.update();
        }
        assert.ok(Math.abs(response.getProperty('left').value - expected) <
          1e-4);
      }

      const animated = app.document.getElementById('animation_event');
      animated.dispatchEvent('animationend', { property_name: 'top' });
      for (let frame = 0; frame < 14; frame++) {
        system.clock[0] += 0.1;
        context.update();
      }
      assert.equal(animated.getProperty('left').unit, rmlui.Unit.PX);
      assert.ok(Math.abs(animated.getProperty('left').value -
        animated.getParentNode().clientWidth * 0.5) < 1e-4);
      app.document.getElementById('exit').click();
      assert.equal(exits, 1);
    },

  'benchmark-independent-update-and-render-single-steps': env => {
    const { context, rmlui } = env;
    const { createBenchmark } = require(
      '../../examples/official/basic/benchmark/main.cjs');
    const app = createBenchmark(context, { random: () => 0 });
    const performance = app.document.getElementById('performance');
    const key = rmlui.KeyIdentifier;
    let presentations = 0;
    const present = () => presentations++;

    app.frame(0.01, present);
    assert.equal(performance.querySelectorAll('.row').length, 50);
    assert.equal(performance.querySelector('.expand').getAttribute('index'),
      '0');
    assert.match(performance.querySelector('a').innerRML, /Route 0/);
    assert.equal(performance.querySelector('input').getAttribute('max'), '10');
    assert.equal(Number(performance.querySelector('input').getValue()), 0);
    assert.equal(performance.querySelector('select').getSelection(), 2);
    assert.equal(performance.querySelector('select').getOption(2).innerRML,
      'Green');
    const first = performance.querySelector('.row');

    app.document.dispatchEvent('keydown', { key_identifier: key.KI_RETURN });
    app.frame(0.02, present);
    assert.equal(performance.querySelector('.row'), first);
    assert.equal(presentations, 2);
    app.document.dispatchEvent('keydown', { key_identifier: key.KI_RIGHT });
    app.frame(0.03, present);
    const replacement = performance.querySelector('.row');
    assert.notEqual(replacement, first);
    app.frame(0.04, present);
    assert.equal(performance.querySelector('.row'), replacement);

    app.document.dispatchEvent('keydown', { key_identifier: key.KI_SPACE });
    app.frame(0.05, present);
    assert.equal(presentations, 4);
    app.document.dispatchEvent('keydown', { key_identifier: key.KI_DOWN });
    app.frame(0.06, present);
    assert.equal(presentations, 5);
    app.frame(0.07, present);
    assert.equal(presentations, 5);

    app.document.dispatchEvent('keydown', { key_identifier: key.KI_RETURN });
    app.frame(0.08, present);
    assert.notEqual(performance.querySelector('.row'), replacement);
    assert.equal(presentations, 5);
    app.close();
  },

  'benchmark-fps-keeps-original-zero-filled-ring': ({ context }) => {
    const { createBenchmark } = require(
      '../../examples/official/basic/benchmark/main.cjs');
    const app = createBenchmark(context, { random: () => 0.5 });
    const fps = app.document.getElementById('fps');

    for (let frame = 1; frame <= 25; frame++) {
      app.frame(frame * 0.01, () => {});
    }
    assert.equal(fps.innerRML, '');
    app.frame(0.26, () => {});
    assert.ok(Math.abs(Number(fps.innerRML.slice(5)) - 13) < 0.0001);
    const performance = app.document.getElementById('performance');
    assert.match(performance.querySelector('a').innerRML, /Route 25/);
    assert.equal(performance.querySelector('input').getAttribute('max'), '30');
    assert.equal(Number(performance.querySelector('input').getValue()), 15);
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
    new sfml.VideoMode(new sfml.Vector2u(1800, 1000)), 'Official basic apps',
    { settings: { stencilBits: 8 } });
  try {
    assert.ok(rmlui.initialise(window, {
      highDpi: false,
      fileRoot: path.resolve(__dirname, '../../third_party/rmlui/Samples'),
    }));
    const system = rmlui.getSystemInterface();
    system.clock[0] = 0;
    for (const font of [
      'LatoLatin-Regular', 'LatoLatin-Italic', 'LatoLatin-Bold',
      'LatoLatin-BoldItalic', 'NotoEmoji-Regular',
    ]) {
      assert.ok(rmlui.loadFontFace(`/assets/${font}.ttf`,
        font === 'NotoEmoji-Regular'));
    }
    const context = rmlui.createContext('official-basic-tests', 1800, 1000);
    await cases[name]({ rmlui, context, system });
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
      encoding: 'utf8', timeout: 25000,
    });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} official basic application failures`);
}
