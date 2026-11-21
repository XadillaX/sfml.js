'use strict';

// Run the RML/RCSS and assets bundled with upstream RmlUi, without copying or
// rewriting them. Only the sample application setup is translated to JS.
const assert = require('node:assert/strict');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { samples } = require('./official/manifest.cjs');
const { processKeyDownShortcuts } = require('./official/shell/shortcuts.cjs');
const { prepareRmlUiResources } =
  require('../tools/dependencies/prepare-rmlui-resources.cjs');
const resources = require('../vendor/rmlui/resources.json');

const upstream = path.resolve(__dirname, '../third_party/rmlui');
const samplesRoot = path.join(upstream, 'Samples');
const visualRoot = path.join(upstream, 'Tests/Data/VisualTests');
const limitations = [
  'VisualTests previews do not imply that every visual assertion passes.',
  'Native renderer protocol checks are separate from VisualTests acceptance.',
];

function visualNames() {
  return Object.keys(resources.files)
    .filter(file => /^Tests\/Data\/VisualTests\/[^/]+\.rml$/.test(file))
    .sort()
    .map(file => path.posix.basename(file, '.rml'));
}

function listSamples() {
  console.log('Usage: npm run examples -- <name> [--frames N]');
  console.log('\nAvailable upstream samples:');
  for (const [ name, sample ] of Object.entries(samples)) {
    console.log(`  ${name.padEnd(22)} ${sample.description}`);
  }
  const names = visualNames();
  console.log(`\nUpstream VisualTests (${names.length} pages):`);
  for (const name of names) {
    console.log(`  visual/${name}`);
  }
  console.log(`\n${limitations.join('\n')}`);
  console.log('\nDefault: variables. Esc: quit. F6/F7: switch VisualTests.');
}

async function run(name, frameLimit, options = {}) {
  await prepareRmlUiResources();
  const { screenshot, exercise, panel, 'log-file': logFile } = options;
  const visual = name.startsWith('visual/');
  const names = visual ? visualNames() : [];
  let visualIndex = names.indexOf(name.slice('visual/'.length));
  const sample = samples[name];
  if ((visual && visualIndex < 0) || (!visual && !sample)) {
    throw new Error(`Unknown sample: ${name}. Use --list for available names.`);
  }

  const sfml = require('sfml.js');
  const rmlui = require('../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(
      sample?.width ?? 1024, sample?.height ?? 768)),
    `sfml.js-rmlui · ${name}`,
    {
      style: sample?.resizable === false
        ? sfml.Style.Titlebar + sfml.Style.Close : sfml.Style.Default,
      settings: { stencilBits: 8, antiAliasingLevel: 2 },
    });
  window.setVerticalSyncEnabled(true);

  let preparation;
  try {
    preparation = sample?.prepare?.({ window, samplesRoot, logFile });
    if (!rmlui.initialise(window, {
      fileRoot: samplesRoot,
      highDpi: sample?.highDpi ?? true,
    })) {
      throw new Error('RmlUi initialisation failed');
    }
    const fonts = sample?.fonts ?? [
      'LatoLatin-Regular', 'LatoLatin-Italic',
      'LatoLatin-Bold', 'LatoLatin-BoldItalic',
      'NotoEmoji-Regular',
    ];
    if (visual) {
      fonts.push('RobotoMono-Regular', 'RobotoMono-Italic',
        'RobotoMono-Bold', 'RobotoMono-BoldItalic');
    }
    for (const font of fonts) {
      const face = typeof font === 'string' ? {
        file: sample?.fonts ? font : `/assets/${font}.ttf`,
        fallback: font === 'NotoEmoji-Regular',
      } : font;
      if (!rmlui.loadFontFace(face.file, face.fallback, face.weight)) {
        throw new Error(`Failed to load ${face.file}`);
      }
    }

    const size = window.getSize();
    const context = rmlui.createContext(
      sample?.contextName ?? 'official', size.x, size.y);
    if (!rmlui.Debugger.initialise(context)) {
      throw new Error('Could not initialise the upstream Debugger');
    }
    let running = true;
    const requestExit = () => {
      running = false;
    };
    const clock = new sfml.Clock();
    const nativeRatio = context.densityIndependentPixelRatio;
    let previousTime = 0;
    let application;
    let document;
    if (sample) {
      application = sample.create(context, {
        requestExit, samplesRoot, scoresFile: options['scores-file'],
      });
      document = application.document;
    } else {
      document = context.loadDocument(
        path.join(visualRoot, `${names[visualIndex]}.rml`));
      document.show();
    }
    if ((name === 'invaders' || name === 'lua-invaders') && exercise) {
      context.update();
      const find = title => {
        for (let index = 0; index < context.getNumDocuments(); index++) {
          const candidate = context.getDocument(index);
          if (candidate.title === title) {
            return candidate;
          }
        }
        throw new Error(`Missing original screen: ${title}`);
      };
      find('Main Menu').querySelector('button').click();
      context.update();
      find('Start Game').querySelector('input[type="submit"]').click();
      context.update();
      document = context.getDocument('game_window');
      assert.equal(document.getElementById('lives').innerRML, '3');
      document.dispatchEvent('keydown', {
        key_identifier: rmlui.KeyIdentifier.KI_SPACE,
      });
    } else if (name === 'basic-demo') {
      const index = [
        'welcome', 'decorators', 'font-effects', 'animations', 'controls',
        'sandbox',
      ].indexOf(panel ?? 'welcome');
      if (index < 0) {
        throw new Error('--panel: welcome, decorators, font-effects, ' +
          'animations, controls or sandbox');
      }
      document.getElementById('menu').setActiveTab(index);
      context.update();
      if (exercise && panel === 'controls') {
        document.querySelector('input[name="name"]').setValue('RmlUi user');
        document.querySelector('input[name="rating"]')
          .dispatchEvent('change', { value: 75 });
        document.querySelector('input[type="submit"]').click();
        assert.equal(application.submitting, true);
      } else if (exercise && panel === 'sandbox') {
        const source = document.getElementById('sandbox_rml_source');
        source.setValue('<h1>Live RML sandbox</h1>\n' +
          '<p id="edited">RML and RCSS update the nested document.</p>');
        source.dispatchEvent('change');
        const style = document.getElementById('sandbox_rcss_source');
        style.setValue('body { color: #fea; background: #224; ' +
          'padding: 20px; }');
        style.dispatchEvent('change');
        application.beforeEvents();
        assert.ok(application.iframe.getElementById('edited'));
      }
    } else if (name === 'data-binding') {
      const index = [ 'basics', 'events', 'invaders', 'forms' ].indexOf(
        panel ?? 'basics');
      if (index < 0) {
        throw new Error('--panel: basics, events, invaders or forms');
      }
      document.getElementById('menu').setActiveTab(index);
      if (exercise) {
        document.querySelector('panel[data-model="basics"] input')
          .dispatchEvent('change', { value: 'cat' });
        document.querySelector('#welcome input[type="range"]')
          .dispatchEvent('change', { value: 70 });
        document.querySelector('#welcome [data-event-click^="add_mouse_pos"]')
          .dispatchEvent('click', { mouse_x: 31, mouse_y: 47 });
        document.querySelector('#controls [data-event-click^="add_subject"]')
          .click();
        document.querySelector('#invaders .start_game button').click();
      }
    } else if (name === 'tree-view' && exercise) {
      context.update();
      const directory = application.files.findIndex(file => file.directory);
      assert.ok(directory >= 0);
      document.querySelectorAll('expand')[directory].click();
      assert.equal(application.files[directory].collapsed, false);
    } else if (name === 'animation' && exercise) {
      // Scripted actions begin after the same layout pass as physical clicks.
      context.update();
      const transition = document.getElementById('transition_class');
      transition.click();
      assert.equal(transition.isClassSet('move_me'), true);
      transition.click();
      assert.equal(transition.isClassSet('move_me'), false);
      document.dispatchEvent('keydown', {
        key_identifier: rmlui.KeyIdentifier.KI_SPACE,
      });
      let presentations = 0;
      application.frame(0, () => presentations++);
      assert.equal(presentations, 0);
      document.dispatchEvent('keydown', {
        key_identifier: rmlui.KeyIdentifier.KI_RETURN,
      });
      application.frame(0, () => presentations++);
      assert.equal(presentations, 1);
      application.frame(0, () => presentations++);
      assert.equal(presentations, 1);
      document.dispatchEvent('keydown', {
        key_identifier: rmlui.KeyIdentifier.KI_SPACE,
      });
    } else if (name === 'effects' && exercise) {
      context.update();
      document.getElementById('menu_button').click();
      context.update();
      document.querySelector('input[data-value="opacity"]')
        .dispatchEvent('change', { value: 0.5 });
      assert.equal(application.model.getVariable('opacity').get(), 0.5);
      document.querySelector('button[data-event-click="reset()"]').click();
      assert.equal(application.model.getVariable('opacity').get(), 1);
    }
    console.log(`RmlUi ${rmlui.version} · ${visual ? name : sample.title}`);
    if (preparation?.logFile) {
      console.log(`Log: ${preparation.logFile}`);
    }
    console.log('Esc: quit');
    if (name === 'variables') {
      console.log(
        '1: dark  2: light  3: high contrast  R: random accent  C: reset');
      console.log('Mission buttons show hover styles only, as upstream.');
    } else if (name === 'animation') {
      console.log('Space: pause  Return: step  +/-: nudge  Arrows: animate');
    } else if (name === 'benchmark') {
      console.log('Space: pause render  Down: render step  ' +
        'Return: pause updates  Right: update step');
    } else if (name === 'basic-demo') {
      console.log('Tabs: decorators, fonts, tweens, controls and live sandbox');
      console.log('Escape cancels an open subject selection before exit.');
    } else if (name === 'invaders' || name === 'lua-invaders') {
      console.log('Left/Right: move  Space: fire  Escape: pause/quit dialog');
    } else if (visual) {
      console.log('F6: previous page  F7: next page');
      console.log(limitations.slice(0, 3).join('\n'));
    }

    const key = sfml.Keyboard.Key;
    const shortcutKeys = new Map([
      [ key.F8, rmlui.KeyIdentifier.KI_F8 ],
      [ key.Num0, rmlui.KeyIdentifier.KI_0 ],
      [ key.Num1, rmlui.KeyIdentifier.KI_1 ],
      [ key.Num2, rmlui.KeyIdentifier.KI_2 ],
      [ key.Num3, rmlui.KeyIdentifier.KI_3 ],
      [ key.Hyphen, rmlui.KeyIdentifier.KI_OEM_MINUS ],
      [ key.Equal, rmlui.KeyIdentifier.KI_OEM_PLUS ],
      [ key.Subtract, rmlui.KeyIdentifier.KI_SUBTRACT ],
      [ key.Add, rmlui.KeyIdentifier.KI_ADD ],
      [ key.R, rmlui.KeyIdentifier.KI_R ],
      [ key.C, rmlui.KeyIdentifier.KI_C ],
      [ key.Escape, rmlui.KeyIdentifier.KI_ESCAPE ],
    ]);
    const processKey = application?.processKey ??
      ((code, modifiers, ratio, priority) =>
        processKeyDownShortcuts(context, code, modifiers, ratio, priority));
    let frames = 0;
    while (running && window.isOpen() && frames < frameLimit) {
      application?.beforeEvents?.();
      let event;
      while ((event = window.pollEvent()) !== undefined) {
        if (event.is('Closed')) {
          running = false;
        } else if (event.is('Resized')) {
          const { size } = event.data;
          context.setDimensions(size.x, size.y);
        } else if (event.is('KeyPressed')) {
          const code = event.data.code;
          if (visual && (code === key.F6 || code === key.F7)) {
            document.unload();
            visualIndex = (visualIndex + (code === key.F7 ? 1 : -1)
              + names.length) % names.length;
            const current = names[visualIndex];
            document = context.loadDocument(
              path.join(visualRoot, `${current}.rml`));
            document.show();
            window.setTitle(`sfml.js-rmlui · visual/${current}`);
            console.log(`visual/${current}`);
            continue;
          }
          const nativeKey = shortcutKeys.get(code);
          const modifiers = (event.data.control ? rmlui.KeyModifier.KM_CTRL : 0)
            + (event.data.shift ? rmlui.KeyModifier.KM_SHIFT : 0)
            + (event.data.alt ? rmlui.KeyModifier.KM_ALT : 0)
            + (event.data.system ? rmlui.KeyModifier.KM_META : 0);
          if (nativeKey !== undefined &&
              !processKey(nativeKey, modifiers, nativeRatio, true)) {
            continue;
          }
          const propagating = context.processEvent(event);
          if (propagating && nativeKey !== undefined) {
            processKey(nativeKey, modifiers, nativeRatio, false);
          }
          if (code === key.Escape && !sample?.documentHandlesEscape) {
            running = false;
          }
          continue;
        }
        context.processEvent(event);
      }
      if (!running) {
        break;
      }
      const time = clock.getElapsedTime().asSeconds();
      const dt = Math.min(time - previousTime, 0.1);
      previousTime = time;
      let image;
      const capture = screenshot && frames === frameLimit - 1;
      const present = () => {
        window.clear(sfml.Color.Black);
        window.flush();
        context.render();
        if (capture) {
          window.flush();
          const size = window.getSize();
          const texture = new sfml.Texture(size);
          texture.update(window);
          image = texture.copyToImage();
          assert.ok(image.pixels.some((byte, index) =>
            index % 4 !== 3 && byte > 100));
        }
        window.display();
      };
      if (application?.frame) {
        application.frame(() => rmlui.getSystemInterface().getElapsedTime(),
          present);
      } else {
        application?.update?.(dt);
        context.update();
        present();
      }
      if (exercise && name === 'data-binding') {
        assert.equal(application.state.basics.animal, 'cat');
        assert.equal(application.models.events.getVariable('positions').size,
          1);
        assert.equal(application.models.forms.getVariable('subjects').size, 6);
        assert.equal(application.state.invaders.num_games_played, 1);
        assert.equal(application.models.events.getVariable('list').size, 8);
      }
      if (image) {
        assert.ok(await image.saveToFile(screenshot));
      }
      frames++;
    }
    // RemoveContext unloads all documents, including both inventory windows.
    application?.close?.();
    context.remove();
  } finally {
    try {
      rmlui.shutdown();
    } finally {
      preparation?.close?.();
      window.close();
    }
  }
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      list: { type: 'boolean' },
      help: { type: 'boolean' },
      frames: { type: 'string' },
      screenshot: { type: 'string' },
      exercise: { type: 'boolean' },
      panel: { type: 'string' },
      'log-file': { type: 'string' },
      'scores-file': { type: 'string' },
    },
  });
  if (values.list || values.help) {
    listSamples();
  } else {
    if (positionals.length > 1) {
      throw new Error('Run one sample at a time. Use --list for names.');
    }
    const frameLimit = values.frames === undefined
      ? Infinity : Number(values.frames);
    if (values.frames !== undefined
        && (!Number.isSafeInteger(frameLimit) || frameLimit < 1)) {
      throw new Error('--frames must be a positive integer.');
    }
    if (values.screenshot && !Number.isFinite(frameLimit)) {
      throw new Error('--screenshot requires --frames.');
    }
    await run(positionals[0] ?? 'variables', frameLimit, values);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
