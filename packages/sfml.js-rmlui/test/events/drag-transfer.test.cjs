'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

/**
 * Send real native mouse operations through RmlUi's drag generator.
 * @param {object} context Live context.
 * @return {void}
 */
function beginDrag(context) {
  context.processMouseMove(40, 40);
  context.processMouseButtonDown(0);
  context.processMouseMove(55, 45);
  context.processMouseMove(350, 45);
}

const cases = {
  'native-pointer-transfer-preserves-upstream-drag-cancellation':
    ({ context, source, destination }) => {
      const events = [];
      source.getFirstChild().addEventListener('dragend', event => {
        events.push([ event.type, event.target.getParentNode().id ]);
      });
      destination.addEventListener('dragdrop', event => {
        const dragged = event.getElementParameter('drag_element');
        assert.equal(dragged, event.parameters.drag_element);
        assert.equal(dragged.id, 'dragged');
        destination.appendChild(source.removeChild(dragged));
        events.push([ event.type, dragged.getParentNode().id ]);
      });

      beginDrag(context);
      context.processMouseButtonUp(0);
      // Context::OnElementDetach silently cancels a removed native drag.
      assert.deepEqual(events, [[ 'dragdrop', 'destination' ]]);
      assert.equal(source.getNumChildren(), 0);
      assert.equal(destination.getFirstChild().id, 'dragged');
    },

  'native-unmodified-drag-finishes-with-dragend': ({ context, source }) => {
    let ended = 0;
    source.getFirstChild().addEventListener('dragend', () => ended++);
    beginDrag(context);
    context.processMouseButtonUp(0);
    assert.equal(ended, 1);
    assert.equal(source.getFirstChild().id, 'dragged');
  },

  'native-detached-node-and-callback-survive-gc-between-listeners':
    async ({ context, source, destination }) => {
      let ended = 0;
      let probes = 0;
      source.getFirstChild().addEventListener('dragend', () => ended++);
      source.getFirstChild().addEventListener('probe', event => {
        assert.equal(event.target.id, 'dragged');
        assert.equal(event.target.getParentNode(), null);
        probes++;
      });
      destination.addEventListener('dragdrop', event => {
        source.removeChild(event.parameters.drag_element);
      });
      // This runs in a different native listener frame, after the first
      // frame's event snapshot and element handles have been released.
      destination.addEventListener('dragdrop', event => {
        for (let i = 0; i < 4; i++) {
          global.gc();
        }
        const dragged = event.getElementParameter('drag_element');
        assert.equal(dragged.getParentNode(), null);
        dragged.dispatchEvent('probe');
      });

      await new Promise(resolve => setImmediate(resolve));
      global.gc();
      beginDrag(context);
      context.processMouseButtonUp(0);
      assert.equal(ended, 0);
      assert.equal(probes, 1);
      assert.equal(source.getNumChildren(), 0);
      assert.equal(destination.getNumChildren(), 0);
    },

  'exception-after-native-detachment-keeps-runtime-usable':
    ({ context, source, destination }) => {
      const failure = new Error('drag listener failure');
      let detached;
      destination.addEventListener('dragdrop', event => {
        detached = source.removeChild(event.parameters.drag_element);
        global.gc();
        throw failure;
      });

      beginDrag(context);
      assert.throws(() => context.processMouseButtonUp(0),
        error => error === failure);
      assert.equal(detached.id, 'dragged');
      assert.equal(detached.getParentNode(), null);
      destination.appendChild(detached);
      context.update();
      assert.equal(destination.getFirstChild(), detached);
    },

  'synthetic-dragdrop-preserves-other-parameter-and-receiver-guards':
    ({ context, source, destination }) => {
      const dragged = source.getFirstChild();
      destination.addEventListener('dragdrop', event => {
        assert.throws(() => source.removeChild(dragged),
          /active|callback/i);
        assert.throws(() => destination.getParentNode()
          .removeChild(destination), /active|callback/i);
        assert.equal(event.parameters.alias, dragged);
      });
      destination.dispatchEvent('dragdrop', {
        drag_element: dragged, alias: dragged,
      });
      assert.equal(dragged.getParentNode(), source);
      context.update();
    },

  'nested-events-cannot-destroy-or-transfer-an-outer-receiver':
    ({ source, destination }) => {
      const dragged = source.getFirstChild();
      destination.addEventListener('dragdrop', () => {
        assert.throws(() => source.removeChild(dragged),
          /active|callback/i);
      });
      dragged.addEventListener('probe', () => {
        destination.dispatchEvent('dragdrop', { drag_element: dragged });
      });
      dragged.dispatchEvent('probe');
      assert.equal(dragged.getParentNode(), source);
    },

  'dragdrop-cannot-destroy-the-parameter-or-transfer-its-ancestor':
    ({ document, source, destination }) => {
      const dragged = source.getFirstChild();
      destination.addEventListener('dragdrop', () => {
        assert.throws(() => {
          source.innerRML = '';
        }, /active|callback/i);
        assert.throws(() => document.removeChild(source),
          /active|callback/i);
        destination.appendChild(source.removeChild(dragged));
      });
      destination.dispatchEvent('dragdrop', { drag_element: dragged });
      assert.equal(dragged.getParentNode(), destination);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(600, 300)), 'Native drag ownership',
    { settings: { stencilBits: 8 } });

  try {
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const context = rmlui.createContext('drag-transfer', 600, 300);
    const document = context.loadDocumentFromMemory(
      '<rml><head><style>' +
      'body { width: 600px; height: 300px; margin: 0; } ' +
      'section { position: absolute; width: 200px; height: 150px; } ' +
      '#source { left: 0; top: 0; } ' +
      '#destination { left: 300px; top: 0; } ' +
      '#dragged { display: block; width: 80px; height: 80px; drag: clone; } ' +
      '</style></head><body>' +
      '<section id="source"><div id="dragged"/></section>' +
      '<section id="destination"/></body></rml>');
    document.show();
    context.update();
    await cases[name]({
      context, document,
      source: document.getElementById('source'),
      destination: document.getElementById('destination'),
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
  if (process.platform === 'darwin') {
    // Compile one probe from the existing vendor objects. The temporary
    // directory holds only its executable, with no separate build environment.
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-drag-'));
    try {
      const result = spawnSync('python3', [
        path.resolve(__dirname,
          '../native/events/build-drag-transfer-contracts.py'),
        directory,
      ], { encoding: 'utf8', timeout: 80000 });
      assert.equal(result.status, 0, result.stdout + result.stderr);
      for (const name of [ 'unmodified', 'transfer', 'detached' ]) {
        assert.ok(result.stdout.includes(`PASS native-drag-${name}`));
      }
      process.stdout.write(result.stdout);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  } else {
    console.log('UNAVAILABLE native drag vendor oracle on this platform');
  }

  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath,
      [ '--expose-gc', __filename, name ], {
        encoding: 'utf8', timeout: 15000,
      });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} native drag ownership failures`);
}
