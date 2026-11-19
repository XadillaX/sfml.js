'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-custom-log-'));
const logFile = path.join(directory, 'log.txt');
const launcher = path.resolve(__dirname, '../../examples/official.cjs');
const result = spawnSync(process.execPath, [
  launcher, 'custom-log', '--frames', '2', '--log-file', logFile,
], { encoding: 'utf8', timeout: 25000 });

try {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const initial = fs.readFileSync(logFile, 'utf8');
  assert.match(initial, /-\*- \(\d+\.\d{2}\): .*assets\/invalid\.rml/);
  assert.match(result.stdout, /Custom File Handler Sample/);
  console.log('PASS custom-log-bounded-launcher-and-original-missing-file');

  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const { prepare, createCustomLog } = require(
    '../../examples/official/basic/custom_log/main.cjs');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(1024, 768)), 'Custom log contracts');
  let prepared;
  try {
    prepared = prepare({ window, logFile });
    assert.ok(rmlui.initialise(window, {
      highDpi: false,
      fileRoot: path.resolve(__dirname, '../../third_party/rmlui/Samples'),
    }));
    const system = rmlui.getSystemInterface();
    system.clock[0] = 2.5;
    for (const type of Object.values(rmlui.LogType)
      .filter(value => typeof value === 'number')) {
      assert.equal(system.logMessage(type, `severity ${type}`), true);
    }
    const logged = fs.readFileSync(logFile, 'utf8');
    for (const [ type, prefix ] of [
      [ 0, '---' ], [ 1, '-!-' ], [ 2, '-!-' ],
      [ 3, '-*-' ], [ 4, '---' ], [ 5, '---' ],
    ]) {
      assert.ok(logged.includes(`${prefix} (2.50): severity ${type}\n`));
    }
    console.log('PASS custom-log-native-severity-and-immediate-file-write');

    system.setClipboardText('application-local 水');
    assert.equal(system.getClipboardText(), 'application-local 水');
    console.log('PASS custom-log-original-application-local-clipboard');
    assert.ok(rmlui.loadFontFace('/assets/LatoLatin-Regular.ttf'));
    const context = rmlui.createContext('custom-log-tests', 1024, 768);
    const app = createCustomLog(context);
    context.update();
    assert.equal(app.document.sourceURL, 'assets/demo.rml');
    assert.equal(app.document.isVisible(), true);
    app.close();
    console.log('PASS custom-log-original-document-load-and-close');
  } finally {
    rmlui.shutdown();
    prepared?.close();
    prepared?.close();
    window.close();
  }
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
