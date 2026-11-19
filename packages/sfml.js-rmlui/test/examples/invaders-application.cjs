'use strict';

// Explicit native application acceptance using the existing POSIX build.
// The ordinary runtime suites remain independent of this compiler fixture.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

/**
 * Find an original screen by its upstream title.
 * @param {object} context Native context.
 * @param {string} title Original document title.
 * @return {object} Live document.
 */
function screen(context, title) {
  for (let index = 0; index < context.getNumDocuments(); index++) {
    const document = context.getDocument(index);
    if (document.title === title) {
      return document;
    }
  }
  return assert.fail(`Missing original screen: ${title}`);
}

/**
 * Check whether the native game loaded its game-over screen.
 * @param {object} context Native context.
 * @return {boolean} Whether the original high-score screen is open.
 */
function gameEnded(context) {
  for (let index = 0; index < context.getNumDocuments(); index++) {
    if (context.getDocument(index).title === 'High Scores') {
      return true;
    }
  }
  return false;
}

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const { createInvaders } = require(
    `../../examples/official/${name}/main.cjs`);
  const reference = JSON.parse(fs.readFileSync(
    `/tmp/rmlui-63-completion/original-${name}-reference.json`, 'utf8'));
  const scoresFile = `/tmp/rmlui-63-completion/${name}-acceptance-scores.txt`;
  fs.writeFileSync(scoresFile, 'Original\t#ff0000\t2\t120\n');
  if (name === 'lua_invaders') {
    fs.writeFileSync(path.join(path.dirname(scoresFile), 'options.dat'),
      'graphics=ok\nreverb=true\n3d=false\n');
  }
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(1024, 768)), name,
    { settings: { stencilBits: 8 } });
  try {
    assert.ok(rmlui.initialise(window, {
      highDpi: false,
      fileRoot: path.resolve(__dirname, '../../third_party/rmlui/Samples'),
    }));
    const clock = rmlui.getSystemInterface().clock;
    clock[0] = 0;
    assert.ok(rmlui.loadFontFace('/assets/LatoLatin-Regular.ttf'));
    assert.ok(rmlui.loadFontFace('/assets/LatoLatin-Italic.ttf'));
    const context = rmlui.createContext('main', 1024, 768);
    assert.ok(rmlui.Debugger.initialise(context));
    const protectedDocuments = context.getNumDocuments();
    let exits = 0;
    const app = createInvaders(context, {
      scoresFile, requestExit: () => exits++,
    });
    context.update();
    const menu = screen(context, 'Main Menu');
    assert.equal(menu.querySelectorAll('button').length, 5);
    assert.ok(context.getDataModel('high_scores'));
    menu.querySelectorAll('button')[2].click();
    context.update();
    const settings = screen(context, 'Options');
    settings.getElementById('bad').click();
    settings.getElementById('reverb').click();
    settings.getElementById('3d').click();
    context.update();
    settings.querySelector('input[value="Accept"]').click();
    context.update();
    screen(context, 'Main Menu').querySelectorAll('button')[2].click();
    context.update();
    const restored = screen(context, 'Options');
    assert.equal(restored.getElementById('bad').hasAttribute('checked'), true);
    assert.equal(restored.getElementById('reverb').hasAttribute('checked'),
      false);
    assert.equal(restored.getElementById('3d').hasAttribute('checked'), true);
    restored.querySelector('input[value="Cancel"]').click();
    context.update();
    screen(context, 'Main Menu').querySelector('button').click();
    context.update();
    const setup = screen(context, 'Start Game');
    setup.querySelector('input[value="hard"]').click();
    setup.querySelector('select').setValue('21,96,189');
    setup.querySelector('input[type="submit"]').click();
    context.update();
    const game = context.getDocument('game_window');
    assert.ok(game.getElementById('game'));
    assert.equal(game.getElementById('score').innerRML,
      String(reference.initial.score));
    assert.equal(game.getElementById('hiscore').innerRML, '120');
    assert.equal(game.getElementById('lives').innerRML,
      String(reference.initial.lives));
    assert.equal(game.getElementById('waves').innerRML,
      String(reference.initial.wave));
    assert.equal(app.state.difficulty, 1);
    assert.deepEqual(app.state.colour, [ 21, 96, 189, 255 ]);
    if (name === 'lua_invaders') {
      app.host.execute('assert(type(StartGame.SetupGame) == "function")');
      app.host.execute('assert(type(Game.SetPaused) == "function")');
    }
    game.dispatchEvent('keydown', {
      key_identifier: rmlui.KeyIdentifier.KI_LEFT,
    });
    clock[0] = 0.1;
    context.update();
    game.dispatchEvent('keyup', {
      key_identifier: rmlui.KeyIdentifier.KI_LEFT,
    });
    game.dispatchEvent('keydown', {
      key_identifier: rmlui.KeyIdentifier.KI_SPACE,
    });
    for (let index = 1; index < 120 && app.state.score === 0; index++) {
      clock[0] = 0.1 + index / 60;
      context.update();
      window.clear(sfml.Color.Black);
      window.flush();
      context.render();
      window.display();
    }
    assert.ok(app.state.score > 0, 'Original bullet must hit an invader');
    const pauseEvent = name === 'invaders' ? 'keyup' : 'keydown';
    game.dispatchEvent(pauseEvent, {
      key_identifier: rmlui.KeyIdentifier.KI_ESCAPE,
    });
    context.update();
    assert.equal(app.state.paused, true);
    screen(context, 'Quit?').querySelectorAll('button')[1].click();
    context.update();
    assert.equal(app.state.paused, false);
    game.dispatchEvent(pauseEvent, {
      key_identifier: rmlui.KeyIdentifier.KI_ESCAPE,
    });
    context.update();
    screen(context, 'Quit?').querySelector('button').click();
    context.update();
    const highScore = screen(context, 'High Scores');
    const input = highScore.getElementById('player_input');
    assert.ok(input, 'Original score entry requests a name');
    input.setValue('Native player');
    input.dispatchEvent('keydown', {
      key_identifier: rmlui.KeyIdentifier.KI_RETURN,
    });
    context.update();
    assert.equal(app.state.score, -1);
    assert.equal(exits, 0);
    highScore.querySelector('button').click();
    context.update();
    assert.equal(context.getDocument('game_window'), null);
    screen(context, 'Main Menu').querySelector('button').click();
    context.update();
    screen(context, 'Start Game').querySelector('input[type="submit"]').click();
    context.update();
    const restarted = context.getDocument('game_window');
    assert.equal(restarted.getElementById('score').innerRML, '0');
    assert.equal(restarted.getElementById('lives').innerRML, '3');
    assert.equal(restarted.getElementById('waves').innerRML, '1');
    // Let the actual native bombs and descending formation end this game.
    // No test-only mutation or replacement of the original game is involved.
    let elapsed = clock[0];
    for (let index = 0; index < 4096 && !gameEnded(context); index++) {
      clock[0] = ++elapsed;
      context.update();
    }
    const ended = screen(context, 'High Scores');
    assert.equal(app.state.score, 0);
    ended.querySelector('button').click();
    context.update();
    screen(context, 'Main Menu').querySelectorAll('button')[4].click();
    context.update();
    app.update();
    assert.equal(exits, 1);
    assert.equal(app.state.exitRequested, true);
    app.close();
    app.close();
    context.update();
    assert.equal(context.getNumDocuments(), protectedDocuments);
    assert.equal(context.getDataModel('high_scores'), null);
    // Both modules share one Core, so the application slot belongs to that
    // runtime rather than to either module's independent static host.
    const { loadApplication } = require(
      '../../examples/official/shell/native-application.cjs');
    const otherName = name === 'invaders' ? 'lua_invaders' : 'invaders';
    const other = loadApplication(otherName);
    assert.throws(() => other.start(context.handle, scoresFile),
      /one original game application per runtime/);
    const scores = fs.readFileSync(scoresFile, 'utf8');
    assert.match(scores, /Native player\t/);
    assert.match(scores, /Original\t#ff0000\t2\t120/);
    if (name === 'lua_invaders') {
      const settingsFile = path.join(path.dirname(scoresFile), 'options.dat');
      const saved = fs.readFileSync(settingsFile, 'utf8');
      assert.match(saved, /graphics=bad/);
      assert.match(saved, /reverb=false/);
      assert.match(saved, /3d=true/);
    }
    // A new runtime must reset original process globals and reload the file.
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, {
      highDpi: false,
      fileRoot: path.resolve(__dirname, '../../third_party/rmlui/Samples'),
    }));
    assert.ok(rmlui.loadFontFace('/assets/LatoLatin-Regular.ttf'));
    const nextContext = rmlui.createContext('main', 1024, 768);
    const next = createInvaders(nextContext, { scoresFile });
    nextContext.update();
    assert.equal(next.state.exitRequested, false);
    assert.equal(next.state.difficulty, 0);
    assert.equal(next.state.score, -1);
    assert.equal(next.state.wave, 0);
    assert.equal(next.state.paused, false);
    assert.deepEqual(next.state.colour, [ 255, 0, 0, 255 ]);
    screen(nextContext, 'Main Menu').querySelectorAll('button')[1].click();
    nextContext.update();
    assert.match(screen(nextContext, 'High Scores').innerRML, /Native player/);
    assert.ok(nextContext.remove());
    assert.throws(() => next.state, /closed/);
    assert.doesNotThrow(() => next.close());
    assert.doesNotThrow(() => next.close());
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
  assert.equal(process.platform, 'darwin',
    'Original-game references require the existing macOS build');
  fs.mkdirSync('/tmp/rmlui-63-completion', { recursive: true });
  for (const name of [ 'invaders', 'lua_invaders' ]) {
    const reference = spawnSync('python3', [
      path.resolve(__dirname,
        '../native/examples/shell/build-original-game.py'),
      name, '/tmp/rmlui-63-completion',
    ], { encoding: 'utf8', timeout: 60000 });
    assert.equal(reference.status, 0,
      reference.stdout + reference.stderr);
    process.stdout.write(reference.stdout);
    const result = spawnSync(process.execPath, [ __filename, name ], {
      encoding: 'utf8', timeout: 60000,
    });
    assert.equal(result.status, 0,
      `${name}: ${result.signal ?? result.status}\n` +
      result.stdout + result.stderr);
    console.log(`PASS ${name}-game-lifecycle-reference-and-score-persistence`);
  }
}
