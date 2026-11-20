'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const {
  createDataBinding,
} = require('../../examples/official/basic/data_binding/main.cjs');
const {
  createTreeView,
} = require('../../examples/official/basic/tree_view/main.cjs');

const cases = {
  'upstream-basics-events-and-synchronous-positions': ({ context }) => {
    const app = createDataBinding(context);
    const { document, models } = app;
    const basics = models.basics;
    const panel = document.querySelector('panel[data-model="basics"]');
    assert.match(panel.innerRML, /Simple data binding example/);
    panel.querySelector('input').dispatchEvent('change', { value: 'cat' });
    context.update();
    assert.equal(basics.getVariable('animal').get(), 'cat');
    assert.match(panel.innerRML, /lazy cat/);
    const detector = document.querySelector(
      '#welcome [data-event-click^="add_mouse_pos"]');
    detector.dispatchEvent('mousemove', { mouse_x: 17, mouse_y: 23 });
    context.update();
    assert.match(detector.innerRML, /x: 17/);
    detector.dispatchEvent('click', { mouse_x: 31, mouse_y: 47 });
    assert.equal(models.events.getVariable('positions').size, 1);
    assert.equal(models.events.getVariable('positions[0].x').get(), 31);
    assert.equal(models.events.getVariable('positions[0].y').get(), 47);
    assert.equal(models.events.getVariable('hello_world').get(),
      'Hello click!');
    context.update();
    const recorded = document.querySelector(
      '#welcome [data-event-click="clear_positions"]');
    assert.match(recorded.innerRML, /x: 31, y: 47/);
    recorded.click();
    assert.equal(models.events.getVariable('positions').size, 0);
    const rating = document.querySelector('#welcome input[type="range"]');
    rating.dispatchEvent('change', { value: 70 });
    app.update(0);
    context.update();
    assert.equal(models.events.getVariable('good_rating').get(), 1);
    assert.equal(models.events.getVariable('great_rating').get(), 0);
    assert.deepEqual([ ...models.events.getVariable('list').getNumericView() ],
      [ 8, 9, 10, 11, 12, 13, 14, 15 ]);
    rating.dispatchEvent('change', { value: 30 });
    app.update(0);
    context.update();
    assert.deepEqual([ ...models.events.getVariable('list').getNumericView() ],
      [ 4, 5, 6, 7 ]);
    assert.equal(models.events.getVariable('good_rating').get(), 0);
  },

  'upstream-forms-radio-checkbox-add-erase-selection-and-submit':
    ({ context }) => {
      const app = createDataBinding(context);
      const { document } = app;
      const model = app.models.forms;
      const form = document.querySelector('#controls form');
      assert.equal(form.getAttribute('onsubmit'), 'submit_form');
      const input = form.querySelector('input[name="name"]');
      input.dispatchEvent('change', { value: 'Fresh subject' });
      form.querySelector('[data-event-click^="add_subject"]').click();
      assert.equal(model.getVariable('subjects').size, 6);
      assert.equal(model.getVariable('subjects[5]').get(), 'Fresh subject');
      context.update();
      assert.match(form.innerRML, /Fresh subject/);
      const pickers = form.querySelectorAll(
        '.picker [data-event-click="selected_subject = it_index"]');
      pickers[5].click();
      assert.equal(model.getVariable('selected_subject').get(), 5);
      context.update();
      const erasers = form.querySelectorAll(
        '.picker [data-event-click="erase_subject(it_index)"]');
      erasers[2].click();
      assert.equal(model.getVariable('subjects').size, 5);
      assert.equal(model.getVariable('selected_subject').get(), 0);
      assert.equal(model.getVariable('subjects[2]').get(), 'Praise');
      form.querySelector('input[type="radio"][value="narwhal"]').click();
      assert.equal(model.getVariable('animal').get(), 'narwhal');
      form.querySelector('input[type="checkbox"][value="pasta"]').click();
      assert.equal(model.getVariable('pasta').get(), true);
      // Upstream has no submit_form listener instancer. Preserve its inert
      // onsubmit string; native form submission still dispatches a real event.
      let submitted;
      form.addEventListener('submit', event => {
        submitted = event.parameters;
      });
      form.submit();
      assert.equal(submitted.animal, 'narwhal');
      assert.match(submitted.meals, /pasta/);
    },

  'upstream-invaders-start-spawn-fire-timing-gameover-and-restart':
    ({ rmlui, context }) => {
      const app = createDataBinding(context, { random: () => 0 });
      const model = app.models.invaders;
      const panel = app.document.getElementById('invaders');
      assert.equal(model.getVariable('invaders').size, 12);
      panel.querySelector('.start_game button').click();
      assert.equal(model.getVariable('health').get(), 100);
      assert.equal(model.getVariable('charge').get(), 30);
      assert.equal(model.getVariable('num_games_played').get(), 1);
      app.update(0.1);
      context.update();
      const enemies = panel.querySelectorAll('invader.alive');
      assert.equal(enemies.length, 1);
      assert.match(enemies[0].innerRML, /Angry invader/);
      assert.equal(model.getVariable('invaders[0].max_health').get(), 303);
      assert.ok(model.getVariable('charge').get() > 30);
      enemies[0].querySelector('img').click();
      assert.equal(model.getVariable('charge').get(), 30);
      assert.ok(model.getVariable('score').get() > 0);
      const firstSpawn = app.state.invaders.next_invader_spawn_time;
      app.update(0.1);
      assert.equal(app.state.invaders.next_invader_spawn_time, firstSpawn);
      // Drive real update mechanics into the invader firing/game-over branch.
      model.getVariable('health').set(0.5);
      model.getVariable('invaders[0].health').set(100);
      model.getVariable('invaders[0].charge').set(100);
      model.dirtyAllVariables();
      app.update(0.1);
      context.update();
      assert.equal(model.getVariable('health').get(), 0);
      assert.notEqual(panel.querySelector('.game_over').getDisplay(),
        rmlui.StyleDisplay.None);
      panel.querySelector('.game_over button').click();
      assert.equal(model.getVariable('num_games_played').get(), 2);
      assert.equal(model.getVariable('score').get(), 0);
      assert.equal(model.getVariable('elapsed_time').get(), 0);
      assert.equal(model.getVariable('invaders[0].health').get(), 0);
      assert.deepEqual(model.getDataTypeRegister().getTransformFuncRegister()
        .call('format_time', [ 65.125 ]),
      { success: true, value: '01:05.12' });
    },

  'upstream-tree-real-directory-traversal-and-descendant-toggle':
    ({ context }) => {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-tree-'));
      try {
        fs.mkdirSync(path.join(directory, 'parent', 'child'),
          { recursive: true });
        fs.writeFileSync(path.join(directory, 'parent', 'child', 'leaf.txt'),
          '');
        fs.writeFileSync(path.join(directory, 'parent', 'direct.txt'), '');
        fs.writeFileSync(path.join(directory, 'B-root.txt'), '');
        fs.writeFileSync(path.join(directory, 'a-root.txt'), '');
        const app = createTreeView(context, directory);
        const files = app.model.getVariable('files');
        assert.equal(files.size, 6);
        assert.equal(files.child(0).child('name').get(), 'parent');
        assert.equal(files.child(0).child('visible').get(), true);
        assert.equal(files.child(1).child('visible').get(), false);
        // Upstream uses native enumeration on Windows and C-locale alphasort
        // on POSIX. Verify the full order against that platform's contract.
        const rootFiles = process.platform === 'win32'
          ? fs.readdirSync(directory, { withFileTypes: true })
            .filter(entry => entry.isFile())
            .map(entry => entry.name)
          : [ 'B-root.txt', 'a-root.txt' ];
        assert.deepEqual([
          files.child(4).child('name').get(),
          files.child(5).child('name').get(),
        ], rootFiles);
        context.update();
        let expanders = app.document.querySelectorAll('expand');
        expanders[0].click();
        assert.equal(files.child(1).child('visible').get(), true);
        assert.equal(files.child(2).child('visible').get(), false);
        assert.equal(files.child(3).child('visible').get(), true);
        context.update();
        expanders = app.document.querySelectorAll('expand');
        expanders[1].click();
        assert.equal(files.child(2).child('visible').get(), true);
        expanders[0].click();
        assert.equal(files.child(1).child('visible').get(), false);
        assert.equal(files.child(2).child('visible').get(), false);
        assert.equal(files.child(1).child('collapsed').get(), true);
        expanders[0].click();
        assert.equal(files.child(1).child('visible').get(), true);
        assert.equal(files.child(2).child('visible').get(), false);
        assert.equal(files.child(4).child('visible').get(), true);
      } finally {
        fs.rmSync(directory, { recursive: true });
      }
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(1600, 900)), 'Official data apps',
    { settings: { stencilBits: 8 } });
  assert.ok(rmlui.initialise(window, {
    highDpi: false,
    fileRoot: path.resolve(__dirname, '../../third_party/rmlui/Samples'),
  }));
  try {
    assert.ok(rmlui.loadFontFace('/assets/LatoLatin-Regular.ttf'));
    const context = rmlui.createContext('official-data-tests', 1600, 900);
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
  assert.equal(failures, 0, `${failures} official data application failures`);
}
