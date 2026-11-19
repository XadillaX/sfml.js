'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function menu(rmlui, host) {
  assert.equal(rmlui.Debugger.initialise(host), true);
  host.update();
  assert.equal(rmlui.Debugger.isVisible(), false);
  rmlui.Debugger.setVisible(true);
  host.update();
  assert.equal(rmlui.Debugger.isVisible(), true);

  return host.getDocument('rmlui-debug-menu');
}

function clickButton(context, button) {
  const point = button.getAbsoluteOffset();
  const size = button.getBox().getSize();
  const x = Math.floor(point.x + size.x / 2);
  const y = Math.floor(point.y + size.y / 2);

  assert.equal(context.getElementAtPoint({ x, y }).id, button.id);
  context.processMouseMove(x, y);
  context.processMouseButtonDown(0);
  context.processMouseButtonUp(0);
  context.update();
}

const cases = {
  'all-five-operations-and-separate-contexts': ({ rmlui, host, target }) => {
    assert.equal(rmlui.Debugger.setContext(target), false);
    const document = menu(rmlui, host);
    assert.ok(document);
    assert.equal(rmlui.Debugger.initialise(host), false);
    assert.equal(rmlui.Debugger.setContext(target), true);
    assert.ok(target.getDocument('rmlui-debug-hook'));
    assert.equal(target.getDocument('rmlui-debug-menu'), null);

    rmlui.Debugger.setVisible(false);
    host.update();
    assert.equal(rmlui.Debugger.isVisible(), false);
    assert.equal(rmlui.Debugger.setContext(null), true);
    target.update();
    assert.equal(target.getNumDocuments(), 0);

    rmlui.Debugger.shutdown();
    host.update();
    assert.equal(host.getNumDocuments(), 0);
    assert.equal(rmlui.Debugger.isVisible(), false);
    assert.equal(rmlui.Debugger.setContext(target), false);
    rmlui.Debugger.shutdown();
  },

  'host-removal-releases-plugin-before-native-context': options => {
    const { rmlui, host, target } = options;
    const document = menu(rmlui, host);
    rmlui.Debugger.setContext(target);

    assert.equal(host.remove(), true);
    assert.equal(rmlui.Debugger.isVisible(), false);
    rmlui.Debugger.setVisible(true);
    assert.equal(rmlui.Debugger.setContext(target), false);
    assert.throws(() => document.getNumChildren(), /valid/i);
    assert.equal(rmlui.Debugger.initialise(target), true);
    rmlui.Debugger.shutdown();
  },

  'target-removal-preserves-host-and-allows-retargeting': options => {
    const { rmlui, host, target } = options;
    menu(rmlui, host);
    rmlui.Debugger.setContext(target);

    target.remove();
    assert.equal(rmlui.Debugger.isVisible(), true);
    assert.equal(rmlui.Debugger.setContext(host), true);
    host.update();
    rmlui.Debugger.shutdown();
    host.update();
    assert.equal(host.getNumDocuments(), 0);
  },

  'individual-debugger-documents-cannot-be-unloaded': options => {
    const { rmlui, host } = options;
    menu(rmlui, host);

    for (const id of [
      'rmlui-debug-menu', 'rmlui-debug-info',
      'rmlui-debug-log', 'rmlui-debug-log-beacon',
      'rmlui-debug-data-models', 'rmlui-debug-hook',
    ]) {
      const document = host.getDocument(id);
      assert.ok(document, id);
      assert.throws(() => document.close(), /Debugger/);
      assert.throws(() => document.unload(), /Debugger/);
      assert.throws(() => host.unloadDocument(document), /Debugger/);
    }

    assert.equal(rmlui.Debugger.isVisible(), true);
    host.update();
    host.render();
  },

  'unload-all-target-documents-detaches-inspection': options => {
    const { rmlui, host, target } = options;
    menu(rmlui, host);
    rmlui.Debugger.setContext(target);
    target.unloadAllDocuments();
    target.update();

    assert.equal(target.getNumDocuments(), 0);
    assert.equal(rmlui.Debugger.isVisible(), true);
    assert.equal(rmlui.Debugger.setContext(target), true);
    target.update();
    assert.ok(target.getDocument('rmlui-debug-hook'));
  },

  'shutdown-clears-only-owned-native-instancer-entries': options => {
    const { rmlui, host } = options;
    menu(rmlui, host);
    rmlui.Debugger.shutdown();

    for (const tag of [
      'debug-hook', 'debug-document', 'debug-info',
      'debug-log', 'debug-data-models',
    ]) {
      assert.equal(rmlui.Factory.getElementInstancer(tag), null, tag);
      assert.equal(host.createDocument(tag), null, tag);
    }
    assert.ok(host.createDocument());
    assert.equal(rmlui.Debugger.initialise(host), true);
  },

  'shutdown-preserves-host-instancer-replacements': options => {
    const { rmlui, host } = options;
    menu(rmlui, host);
    const replacement = rmlui.Factory.getElementInstancer('body');
    const tags = [
      'debug-hook', 'debug-document', 'debug-info',
      'debug-log', 'debug-data-models',
    ];
    for (const tag of tags) {
      rmlui.Factory.registerElementInstancer(tag, replacement);
    }
    rmlui.Debugger.shutdown();

    for (const tag of tags) {
      assert.equal(rmlui.Factory.getElementInstancer(tag), replacement, tag);
      const document = host.createDocument(tag);
      assert.ok(document, tag);
      document.close();
    }
    host.update();
    assert.equal(host.getNumDocuments(), 0);
  },

  'unload-all-host-documents-shuts-down-debugger': options => {
    const { rmlui, host, target } = options;
    menu(rmlui, host);
    rmlui.Debugger.setContext(target);

    host.unloadAllDocuments();
    host.update();
    target.update();
    assert.equal(rmlui.Debugger.isVisible(), false);
    assert.equal(host.getNumDocuments(), 0);
    assert.equal(target.getNumDocuments(), 0);
    assert.equal(rmlui.Debugger.initialise(host), true);
  },

  'runtime-restart-has-no-debugger-state': options => {
    const { rmlui, host, window } = options;
    menu(rmlui, host);
    rmlui.shutdown();

    assert.throws(() => rmlui.Debugger.isVisible(), /initial/i);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.equal(rmlui.Debugger.isVisible(), false);
    const next = rmlui.createContext('restart-debugger', 960, 640);
    assert.equal(rmlui.Debugger.initialise(next), true);
  },

  'strict-arguments-and-callback-reentry': options => {
    const { rmlui, host } = options;
    for (const invalid of [ null, {}, 'host', 1 ]) {
      assert.throws(() => rmlui.Debugger.initialise(invalid),
        /context|handle/i);
    }
    assert.throws(() => rmlui.Debugger.setContext({}), /context|handle/i);
    assert.throws(() => rmlui.Debugger.setVisible(1), /boolean/i);

    const document = menu(rmlui, host);
    const button = document.getElementById('outlines-button');
    button.addEventListener('click', () => {
      assert.equal(rmlui.Debugger.isVisible(), true);
      assert.throws(() => rmlui.Debugger.shutdown(), /callback|reent/i);
      assert.throws(() => rmlui.Debugger.setContext(null), /callback|reent/i);
    });
    button.click();
    host.update();
    assert.equal(rmlui.Debugger.isVisible(), true);
  },

  'log-messages-reach-native-debugger-document': options => {
    const { rmlui, host } = options;
    const document = menu(rmlui, host);
    document.getElementById('event-log-button').click();
    rmlui.Log.message(rmlui.LogType.Warning, '%s', 'debugger-log-probe');
    host.update();

    const log = host.getDocument('rmlui-debug-log');
    assert.ok(log.isVisible());
    assert.match(log.innerRML, /debugger-log-probe/);
  },

  'debugger-forwards-logs-and-restores-selected-system-interface': options => {
    const { rmlui, window } = options;
    rmlui.shutdown();
    const messages = [];
    const system = new rmlui.SystemInterface(window, {
      logMessage(type, message) {
        messages.push({ type, message });
        return true;
      },
    });
    rmlui.setSystemInterface(system);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const host = rmlui.createContext('custom-log-debugger', 960, 640);
    menu(rmlui, host);
    rmlui.Log.message(rmlui.LogType.Warning, 'during-debugger');
    assert.ok(messages.some(entry => entry.message === 'during-debugger'));

    rmlui.Debugger.shutdown();
    assert.equal(rmlui.getSystemInterface(), system);
    rmlui.Log.message(rmlui.LogType.Warning, 'after-debugger');
    assert.ok(messages.some(entry => entry.message === 'after-debugger'));
  },

  'native-data-model-reflection-updates-and-retargets': options => {
    const { rmlui, host, target } = options;
    const model = target.createDataModel('debugger_model');
    assert.equal(model.bind('count', 42), true);
    const document = menu(rmlui, host);
    rmlui.Debugger.setContext(target);
    document.getElementById('data-models-button').click();

    const clock = rmlui.getSystemInterface().clock;
    clock[0] = 1;
    host.update();
    const explorer = host.getDocument('rmlui-debug-data-models');
    assert.match(explorer.innerRML, /debugger_model/);
    assert.match(explorer.innerRML, /count/);
    assert.match(explorer.innerRML, /42/);

    assert.equal(model.getVariable('count').set(73), true);
    clock[0] = 2;
    host.update();
    assert.match(explorer.innerRML, /73/);
    rmlui.Debugger.setContext(host);
    clock[0] = 3;
    host.update();
    assert.doesNotMatch(explorer.innerRML, /debugger_model/);
  },

  'owned-context-host-and-target-use-the-same-release-contract': options => {
    const { rmlui, host } = options;
    const manager = host.getRenderManager();
    const ownedHost = rmlui.Factory.instanceContext(
      'owned-host', manager, null);
    const ownedTarget = rmlui.Factory.instanceContext(
      'owned-target', manager, null);
    ownedHost.setDimensions(960, 640);
    ownedTarget.setDimensions(960, 640);
    menu(rmlui, ownedHost);
    assert.equal(rmlui.Debugger.setContext(ownedTarget), true);

    assert.equal(ownedTarget.remove(), true);
    assert.equal(rmlui.Debugger.isVisible(), true);
    assert.equal(ownedHost.remove(), true);
    assert.equal(rmlui.Debugger.isVisible(), false);
    assert.equal(rmlui.Debugger.initialise(host), true);
  },

  'native-custom-struct-array-reflection-and-error-propagation': options => {
    const { rmlui, host, target } = options;
    const model = target.createDataModel('reflection');
    const scalar = model.registerScalar('Real', 'float64');
    const array = model.registerArray('Reals', scalar);
    assert.equal(model.bind('numbers', [ 11, 19 ], array), true);
    const source = model.getVariable('numbers');
    const container = model.registerCustomDataVariableDefinition('Container', {
      type: rmlui.DataVariableType.Struct,
      child: (data, address) => (address === 'values' ? data.variable : null),
      reflectMemberNames: () => [ 'values' ],
    });
    model.bindCustomDataVariable('container', { variable: source }, container);
    const failure = new Error('debugger-reflection-failure');
    let fail = false;
    model.bindFunc('callback', () => {
      if (fail) {
        throw failure;
      }
      return 29;
    });
    const document = menu(rmlui, host);
    rmlui.Debugger.setContext(target);
    document.getElementById('data-models-button').click();
    const clock = rmlui.getSystemInterface().clock;
    clock[0] = 1;
    host.update();

    const explorer = host.getDocument('rmlui-debug-data-models');
    assert.match(explorer.innerRML, /container/);
    assert.match(explorer.innerRML, /\.values/);
    assert.match(explorer.innerRML, /11/);
    assert.match(explorer.innerRML, /19/);
    assert.match(explorer.innerRML, /29/);

    fail = true;
    clock[0] = 2;
    assert.throws(() => host.update(), error => error === failure);
    fail = false;
    clock[0] = 3;
    host.update();
    assert.match(explorer.innerRML, /29/);
  },

  'retired-hooks-outlive-plugin-and-release-after-reinitialization':
    options => {
      const { rmlui, host } = options;
      const targets = Array.from({ length: 4 }, (_, index) =>
        rmlui.createContext(`retired-target-${index}`, 960, 640));
      menu(rmlui, host);

      for (let iteration = 0; iteration < 16; iteration += 1) {
        assert.equal(rmlui.Debugger.setContext(targets[iteration % 4]), true);
      }
      rmlui.Debugger.shutdown();
      menu(rmlui, host);

      for (const target of targets) {
        target.update();
        assert.equal(target.getNumDocuments(), 0);
        assert.equal(target.remove(), true);
      }
      assert.equal(rmlui.Debugger.isVisible(), true);
    },

  'borrowed-debugger-allocators-outlive-the-plugin': options => {
    const { rmlui, host } = options;
    menu(rmlui, host);
    const entries = [
      'debug-hook', 'debug-document', 'debug-info',
      'debug-log', 'debug-data-models',
    ].map(tag => {
      const instancer = rmlui.Factory.getElementInstancer(tag);
      const element = instancer.instanceElement(null, tag, {});
      assert.ok(element, tag);
      return { tag, instancer, element };
    });
    rmlui.Debugger.shutdown();

    for (const { tag, instancer, element } of entries) {
      assert.equal(element.tagName, tag);
      instancer.releaseElement(element);
      const next = instancer.instanceElement(null, tag, {});
      assert.ok(next, tag);
      instancer.releaseElement(next);
    }
  },

  'pointer-interaction-at-one-and-two-times-density': options => {
    const { rmlui, host } = options;
    const document = menu(rmlui, host);

    for (const density of [ 1, 2 ]) {
      host.setDensityIndependentPixelRatio(density);
      host.update();
      const button = document.getElementById('event-log-button');
      const explorer = host.getDocument('rmlui-debug-log');
      if (explorer.isVisible()) {
        explorer.hide();
        host.update();
      }

      clickButton(host, button);
      assert.ok(explorer.isVisible(), `Debugger pointer at density ${density}`);
      host.render();
    }
  },
};

function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(960, 640)), 'Debugger contracts');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const host = rmlui.createContext('debugger-host', 960, 640);
  const target = rmlui.createContext('debugger-target', 960, 640);

  try {
    cases[name]({ rmlui, window, host, target });
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]);
} else {
  let failures = 0;

  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath, [ __filename, name ], {
      encoding: 'utf8', timeout: 20000,
    });
    if (result.status !== 0) {
      failures += 1;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }

  assert.equal(failures, 0, `${failures} debugger failures`);
}
