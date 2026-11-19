'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const cases = {
  'font-before-initialise': function() {
    const rmlui = require('../../dist');
    assert.throws(() => rmlui.loadFontFace('missing.ttf'), /initialised/i);
  },

  'subtree-aliases': function({ document }) {
    const first = document.getElementById('child');
    const alias = document.querySelector('#child');
    document.getElementById('parent').innerRML = '<div id="replacement"/>';
    for (const element of [ first, alias ]) {
      assert.throws(() => element.id, /no longer valid/i);
      assert.throws(
        () => element.setAttribute('id', 'stale'), /no longer valid/i);
    }
    assert.equal(document.getElementById('replacement').id, 'replacement');
  },

  'close-update': function({ context, document }) {
    const child = document.getElementById('child');
    const alias = child.getOwnerDocument();
    let unloads = 0;
    document.addEventListener('unload', () => {
      unloads++;
      assert.equal(document.title, 'Lifetime');
      assert.equal(alias.title, 'Lifetime');
      assert.equal(child.id, 'child');
      assert.throws(() => {
        document.innerRML = '<div/>';
      }, /active native subtree/i);
    });
    document.close();
    assert.equal(unloads, 1);
    assert.equal(document.title, 'Lifetime', 'close defers destruction');
    context.update();
    for (const wrapper of [ document, alias ]) {
      assert.throws(() => wrapper.title, /no longer valid/i);
    }
    assert.throws(() => child.id, /no longer valid/i);
  },

  'unload-update': function({ context, document }) {
    document.unload();
    assert.equal(document.title, 'Lifetime');
    context.update();
    assert.throws(() => document.title, /no longer valid/i);
  },

  'same-name-context': function({ rmlui, context, document }) {
    const alias = new rmlui.Context(context.handle);
    context.remove();
    const replacement = rmlui.createContext('lifetime', 100, 100);
    assert.throws(() => alias.remove(), /no longer valid/i);
    assert.throws(() => context.update(), /no longer valid/i);
    assert.throws(() => document.title, /no longer valid/i);
    assert.equal(replacement.update(), true);
    replacement.remove();
  },

  'retained-dimensions': function({ context }) {
    const dimensions = context.dimensions;
    context.setDimensions(220, 180);
    assert.equal(dimensions.width, 220);
    context.remove();
    assert.equal(dimensions.width, 0, 'retained view marks removal');
    assert.equal(dimensions.height, 0);
  },

  'shutdown-reinitialise': function({ rmlui, window, context, document }) {
    const child = document.getElementById('child');
    const dimensions = context.dimensions;
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const replacement = rmlui.createContext('lifetime', 100, 100);
    assert.throws(() => context.remove(), /no longer valid/i);
    assert.throws(() => child.id, /no longer valid/i);
    assert.throws(() => document.title, /no longer valid/i);
    assert.equal(dimensions.width, 0);
    assert.equal(replacement.update(), true);
  },

  'font-after-shutdown': function({ rmlui }) {
    rmlui.shutdown();
    assert.throws(() => rmlui.loadFontFace('missing.ttf'), /initialised/i);
    const bytes = Uint8Array.of(0, 0, 0, 84);
    rmlui.FontEffect.fillColorValuesFromAlpha(bytes, { x: 1, y: 1 }, 4);
    assert.deepEqual(Array.from(bytes), [ 84, 84, 84, 84 ]);
  },

  'document-type-check': function({ rmlui, document }) {
    const forged = new rmlui.Document(document.getElementById('child').handle);
    assert.throws(() => forged.title, /document/i);
  },

  'wrapper-gc': async function({ document }) {
    let wrapper = document.getElementById('child');
    const weak = new WeakRef(wrapper);
    wrapper = null;
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    assert.equal(document.getElementById('child').id, 'child');
  },

  'foreign-worker': async function({ context, document }) {
    const { Worker } = require('node:worker_threads');
    const nativePath = path.resolve(__dirname,
      '../../build/Release/rmlui.node');
    const worker = new Worker(`
      const assert = require('node:assert/strict');
      const { parentPort, workerData } = require('node:worker_threads');
      const native = require(workerData.nativePath);
      const { Style } = require(workerData.packagePath);
      assert.match(native.getVersion(), /^6\\.3/);
      // These exact methods own independent values and never access RmlState.
      // Valid operations run in box/numeric-value/transform runtime tests.
      const valueMethods = new Set([
        'cloneBox', 'boxGetSize', 'boxGetPosition', 'boxGetFrameSize',
        'boxSetContent', 'boxSetEdge', 'boxGetEdge', 'boxGetCumulativeEdge',
        'boxGetSizeAcross', 'boxEquals', 'boxNotEquals',
        'createRenderBox', 'cloneRenderBox', 'renderBoxGetFillSize',
        'renderBoxGetFillOffset', 'renderBoxGetBorderOffset',
        'renderBoxGetBorderWidths', 'renderBoxGetBorderRadius',
        'renderBoxSetFillSize', 'renderBoxSetBorderOffset',
        'renderBoxSetBorderWidths', 'renderBoxSetBorderRadius',
        'renderBoxEquals', 'renderBoxNotEquals',
        'cloneNumericValue', 'numericValueEquals', 'numericValueNotEquals',
        'transformGetPrimitives', 'transformGetPrimitive',
        'transformGetNumPrimitives', 'transformClearPrimitives',
      ]);
      const transformInputs = new Map([
        ['transformSetPrimitives', /primitives must be an array/i],
        ['transformAddPrimitive', /primitive object/i],
        ['makeTransformPrimitive', /TransformPrimitiveType/],
      ]);
      const styleMethods = new Set([
        'createLengthPercentage', 'createLengthPercentageAuto',
        'createNumberAuto', 'createVerticalAlign', 'createLineHeight',
        'createClip', 'resolveLengthPercentage', 'resolveLengthPercentageAuto',
        'resolveLengthPercentageOr', 'resolveLengthPercentageAutoOr',
      ]);
      const glyphMethods = new Set([
        'createFontGlyph', 'weakCopyFontGlyph',
        'getGlyphBitmap', 'setGlyphBitmap', 'fillColorValuesFromAlpha',
      ]);
      const pixels = Uint8Array.of(1, 2, 3, 96);
      native.fillColorValuesFromAlpha(pixels, { x: 1, y: 1 }, 4);
      assert.deepEqual(Array.from(pixels), [96, 96, 96, 96]);
      const glyph = native.createFontGlyph();
      glyph.bearingView.set([-2, 4]);
      glyph.advanceView[0] = 7;
      glyph.bitmapDimensionsView.set([1, 1]);
      assert.equal(glyph.colorFormatView[0], 1);
      native.setGlyphBitmap(glyph.handle, Uint8Array.of(123));
      const weakGlyph = native.weakCopyFontGlyph(glyph.handle);
      assert.deepEqual(Array.from(weakGlyph.bearingView), [-2, 4]);
      assert.equal(weakGlyph.advanceView[0], 7);
      assert.equal(native.getGlyphBitmap(weakGlyph.handle, true), null);
      native.getGlyphBitmap(glyph.handle, true)[0] = 42;
      native.setGlyphBitmap(glyph.handle, null);
      assert.equal(native.getGlyphBitmap(glyph.handle, false), null);
      assert.equal(native.getGlyphBitmap(weakGlyph.handle, false)[0], 42);
      const percentage = native.createLengthPercentage(1, 25);
      const autoPercentage = native.createLengthPercentageAuto(2, 25);
      assert.equal(percentage.valueView[0], 25);
      assert.equal(autoPercentage.typeView[0], 2);
      assert.equal(native.createNumberAuto(1, -4).valueView[0], -4);
      assert.equal(native.createVerticalAlign(9, 12).valueView[0], 12);
      assert.equal(native.createLineHeight(24, 0, 1.5)
        .inheritValueView[0], 1.5);
      assert.equal(native.createClip(3, -1).type, 1);
      assert.equal(native.resolveLengthPercentage(percentage.handle, 200), 50);
      assert.equal(native.resolveLengthPercentageAuto(
        autoPercentage.handle, 200), 50);
      assert.equal(native.resolveLengthPercentageOr(
        percentage.handle, -1, 9), 9);
      assert.equal(native.resolveLengthPercentageAutoOr(
        autoPercentage.handle, -1, 9), 9);
      const structMethods = new Set();
      for (const name of ['CommonValues', 'InheritedValues', 'RareValues']) {
        const create = 'create' + name;
        const owner = native[create]();
        structMethods.add(create);
        const prefix = name[0].toLowerCase() + name.slice(1);
        const descriptors = Object.getOwnPropertyDescriptors(
          Style[name].prototype);
        for (const [field, descriptor] of Object.entries(descriptors)) {
          if (!descriptor.get || field.endsWith('View')) continue;
          const suffix = field[0].toUpperCase() + field.slice(1);
          const get = prefix + 'Get' + suffix;
          const set = prefix + 'Set' + suffix;
          if (!native[get]) continue;
          const value = native[get](owner.handle);
          native[set](owner.handle, field === 'clip' ? value.handle : value);
          structMethods.add(get);
          structMethods.add(set);
        }
      }
      assert.equal(structMethods.size, 129);
      const meshMethods = new Set([
        'createMesh', 'meshVertices', 'meshIndices', 'meshIsValid',
        'meshVertexCount', 'meshResize', 'meshEquals',
        'meshAllocateCommands', 'meshAppendCommands',
        'createConvolutionFilter', 'convolutionInitialise',
        'convolutionKernel', 'convolutionRun', 'convolutionAllocateBytes',
      ]);
      const mesh = native.createMesh(3, 3);
      const bytes = native.meshVertices(mesh);
      native.meshIndices(mesh).set([0, 1, 2]);
      assert.equal(bytes.length, 60);
      assert.equal(native.meshVertexCount(mesh), 3);
      assert.equal(native.meshIsValid(mesh), true);
      assert.equal(native.meshEquals(mesh, mesh), true);
      native.meshResize(mesh, 4, 6);
      assert.equal(native.meshVertexCount(mesh), 4);
      assert.equal(bytes.length, 60);

      const commands = native.meshAllocateCommands(1);
      commands.set([0, 2, 3, 4, 5, 60, 30, 10, 120, 0, 0, 1, 1]);
      native.meshAppendCommands(mesh, commands, 1);
      assert.equal(native.meshVertexCount(mesh), 8);
      assert.deepEqual(Array.from(native.meshIndices(mesh).slice(-6)),
        [4, 7, 5, 5, 7, 6]);
      const filter = native.createConvolutionFilter();
      assert.equal(native.convolutionInitialise(filter, 0, 0), true);
      native.convolutionKernel(filter, 0)[0] = 1;
      const sourceAlpha = native.convolutionAllocateBytes(1);
      const destinationAlpha = native.convolutionAllocateBytes(1);
      sourceAlpha[0] = 70;
      native.convolutionRun(filter, destinationAlpha, {x: 1, y: 1}, 1,
        1, sourceAlpha, {x: 1, y: 1}, {x: 0, y: 0}, 1);
      assert.equal(destinationAlpha[0], 70);

      // Retained string/URL resources belong to this worker, independently
      // of the main thread's runtime. Execute every resource entry before
      // removing it from the runtime-ownership checks below.
      const resourceMethods = new Set();
      function resource(name, ...args) {
        assert.equal(typeof native[name], 'function', name);
        resourceMethods.add(name);
        return native[name](...args);
      }

      const text = resource('createStringView', 'Aé中', 0);
      assert.equal(resource('stringViewText', text.handle), 'Aé中');
      assert.deepEqual(Array.from(resource('stringViewBytes', text.handle)),
        [65, 195, 169, 228, 184, 173]);
      const index = resource('stringViewIndex', text.handle);
      assert.deepEqual(Array.from(index.offsets), [0, 1, 3, 6]);
      assert.equal(resource('stringViewOperation', text.handle,
        'toCharacters', 2), 2);
      assert.deepEqual(Array.from(resource('convertStringOffsets',
        text.handle, new Int32Array([0, 1, 2]), undefined, true)), [0, 1, 3]);
      assert.equal(resource('stringUnary', 'lower', 'ABC'), 'abc');
      assert.deepEqual(resource('expandString', 'a,b', 44,
        undefined, undefined, false), ['a', 'b']);
      assert.equal(resource('joinString', ['a', 'b'], 44, ''), 'a,b');
      assert.equal(resource('encodeCharacters', 0x4e2d, false), '中');
      assert.deepEqual(resource('formatTypedString', '%s:%d', ['é', 7]),
        {value: 'é:7', length: 4});

      const url = resource('createURL', '');
      for (const [suffix, value] of [
        ['Protocol', 'https'], ['Login', 'reader'], ['Password', 'secret'],
        ['Host', 'example.test'], ['Port', 81], ['Path', 'assets/'],
        ['FileName', 'panel'], ['Extension', 'rml'],
      ]) {
        assert.equal(resource('urlSet' + suffix, url, value), true);
        assert.equal(resource('urlGet' + suffix, url), value);
      }
      assert.equal(resource('urlPrefixPath', url, 'root'), true);
      assert.equal(resource('urlGetPathedFileName', url),
        'root/assets/panel.rml');
      resource('urlSetParameter', url, 'name', 'é');
      assert.deepEqual(resource('urlGetParameters', url), {name: 'é'});
      assert.equal(resource('urlGetQueryString', url), 'name=%C3%A9');
      resource('urlSetParameters', url, {name: '中'});
      assert.match(resource('urlGetURL', url), /name=%E4%B8%AD$/);
      resource('urlClearParameters', url);
      assert.equal(resource('urlSetURL', url, 'a.rml'), true);
      assert.equal(resource('urlLessThan', url,
        resource('createURL', 'z.rml')), true);
      assert.equal(resource('urlEncode', 'é'), '%C3%A9');
      assert.equal(resource('urlDecode', '%C3%A9'), 'é');
      assert.equal(resourceMethods.size, 40);

      for (const name of Object.keys(native)) {
        if (typeof native[name] !== 'function' || name === 'getVersion') {
          continue;
        }
        if (name === 'createBox') {
          assert.deepEqual(Array.from(native.createBox().content), [ 0, 0 ]);
          continue;
        }
        if (name === 'createNumericValue') {
          const value = native.createNumericValue();
          assert.deepEqual(Array.from(value.numberView), [ 0 ]);
          assert.deepEqual(Array.from(value.unitView), [ 0 ]);
          continue;
        }
        if (name === 'createTransform') {
          const value = native.createTransform();
          assert.equal(native.transformGetNumPrimitives(value), 0);
          continue;
        }
        if (transformInputs.has(name)) {
          assert.throws(() => native[name](), transformInputs.get(name), name);
          transformInputs.delete(name);
          continue;
        }
        if (styleMethods.delete(name)) {
          continue;
        }
        if (glyphMethods.delete(name)) {
          continue;
        }
        if (structMethods.delete(name)) {
          continue;
        }
        if (meshMethods.delete(name)) {
          continue;
        }
        if (resourceMethods.delete(name)) {
          continue;
        }
        if (valueMethods.has(name)) {
          assert.throws(
            () => native[name](),
            /matching native handle|finite|box area|box direction/i, name);
          valueMethods.delete(name);
          continue;
        }
        assert.throws(
          () => native[name](), /owning.*(environment|thread)/i, name);
      }
      assert.equal(valueMethods.size, 0, 'all declared value methods exist');
      assert.equal(transformInputs.size, 0, 'all transform methods exist');
      assert.equal(styleMethods.size, 0, 'all style methods exist');
      assert.equal(glyphMethods.size, 0, 'all glyph methods executed');
      assert.equal(structMethods.size, 0, 'all struct methods executed');
      assert.equal(meshMethods.size, 0, 'all mesh methods executed');
      assert.equal(resourceMethods.size, 0, 'all resource methods executed');
      parentPort.postMessage('owner protected');
    `, {
      eval: true,
      workerData: {
        nativePath, packagePath: path.resolve(__dirname, '../../dist'),
      },
    });
    const messages = [];
    worker.on('message', message => messages.push(message));
    await new Promise((resolve, reject) => {
      worker.once('error', reject);
      worker.once('exit', code => {
        if (code !== 0) {
          reject(new Error(`worker exit ${code}`));
        } else {
          resolve();
        }
      });
    });
    assert.deepEqual(messages, [ 'owner protected' ]);
    assert.equal(document.getElementById('child').id, 'child');
    assert.equal(context.update(), true);
  },

  'environment-cleanup': function({ document }) {
    document.addEventListener('unload', () => {
      throw new Error('environment cleanup must not call JavaScript');
    });
    // Intentionally leave the runtime, window and callback alive at exit.
  },

  'foreign-worker-contention': async function({ context }) {
    const { Worker } = require('node:worker_threads');
    const shared = new Int32Array(new SharedArrayBuffer(12));
    const worker = new Worker(`
      const { workerData } = require('node:worker_threads');
      const native = require(workerData.nativePath);
      const shared = new Int32Array(workerData.buffer);
      Atomics.store(shared, 0, 1);
      Atomics.notify(shared, 0);
      while (!Atomics.load(shared, 1)) {
        try {
          native.createContext('foreign', 1, 1);
        } catch {}
        Atomics.add(shared, 2, 1);
      }
    `, {
      eval: true,
      workerData: {
        nativePath: path.resolve(__dirname, '../../build/Release/rmlui.node'),
        buffer: shared.buffer,
      },
    });
    const exited = new Promise((resolve, reject) => {
      worker.once('error', reject);
      worker.once('exit', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`worker exit ${code}`));
        }
      });
    });
    let failures = 0;
    try {
      Atomics.wait(shared, 0, 0, 5000);
      assert.equal(Atomics.load(shared, 0), 1, 'worker is ready');
      for (let i = 0; i < 200000; i++) {
        try {
          assert.equal(context.dimensions.width, 240);
        } catch {
          failures++;
        }
      }
    } finally {
      Atomics.store(shared, 1, 1);
      await exited;
    }
    assert.ok(Atomics.load(shared, 2) > 0, 'foreign entries actually ran');
    assert.equal(failures, 0, 'foreign entries must not interrupt the owner');
  },
};

async function run(name) {
  if (name === 'font-before-initialise') {
    return cases[name]();
  }
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(240, 200)), 'RmlUi lifetime test');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('lifetime', 240, 200);
    const document = context.loadDocumentFromMemory(`
<rml><head><title>Lifetime</title></head><body>
<div id="parent"><div id="child"/></div></body></rml>`);
    await cases[name]({ sfml, rmlui, window, context, document });
  } finally {
    if (name !== 'environment-cleanup') {
      rmlui.shutdown();
      window.close();
    }
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
    const result = spawnSync(process.execPath,
      [ '--expose-gc', __filename, name ],
      { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} lifetime regressions failed`);
}
