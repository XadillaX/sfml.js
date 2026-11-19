'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let i = 0; i < 16; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

function makeGlyph(rmlui) {
  const glyph = new rmlui.FontGlyph();
  glyph.bitmapDimensions = { x: 2, y: 2 };
  glyph.bearing = { x: 1, y: 3 };
  glyph.advance = 5;
  glyph.bitmapData = Uint8Array.of(10, 20, 30, 40);
  return glyph;
}

const cases = {
  'overrides-defaults-metadata-and-input-snapshots': ({ rmlui }) => {
    const glyph = makeGlyph(rmlui);
    const base = new rmlui.FontEffect({});
    assert.equal(base.hasUniqueTexture, false);
    assert.equal(base.getGlyphMetrics(glyph).supported, false);
    let retained;
    const effect = new rmlui.FontEffect({
      hasUniqueTexture: () => true,
      getGlyphMetrics(input, origin, dimensions) {
        retained = input;
        assert.ok(input instanceof rmlui.FontGlyph);
        assert.deepEqual(input.bearing, { x: 1, y: 3 });
        assert.equal(input.advance, 5);
        assert.deepEqual(origin, { x: 7, y: -8 });
        assert.deepEqual(dimensions, { x: 4, y: 5 });
        glyph.bitmapData = null;
        input.bitmapData[0] = 99;
        effect.layer = rmlui.FontEffectLayer.Front;
        return {
          supported: true,
          origin: { x: origin.x + 2, y: origin.y - 2 },
          dimensions: { x: dimensions.x + 1, y: dimensions.y + 1 },
        };
      },
    });
    assert.equal(effect.hasUniqueTexture, true);
    effect.colour = {
      type: 'colourb', red: 2, green: 3, blue: 4, alpha: 255,
    };
    assert.equal(effect.hasUniqueTexture, true);
    assert.deepEqual(effect.getGlyphMetrics(
      glyph, { x: 7, y: -8 }, { x: 4, y: 5 }), {
      supported: true, origin: { x: 9, y: -10 }, dimensions: { x: 5, y: 6 },
    });
    assert.deepEqual(Array.from(retained.bitmapData), [ 99, 20, 30, 40 ]);
    assert.equal(effect.layer, rmlui.FontEffectLayer.Front);
  },

  'texture-stride-isolation-and-escaped-views': ({ rmlui }) => {
    const glyph = makeGlyph(rmlui);
    const allocation = new Uint8Array(40).fill(91);
    const destination = allocation.subarray(4, 28);
    let escaped;
    let input;
    const effect = new rmlui.FontEffect({
      generateGlyphTexture(bytes, dimensions, stride, source) {
        assert.equal(stride, 16);
        assert.deepEqual(dimensions, { x: 2, y: 2 });
        assert.deepEqual(Array.from(source.bitmapData), [ 10, 20, 30, 40 ]);
        input = source;
        escaped = bytes;
        // Padding must not reveal a neighbouring glyph or the caller's bytes.
        assert.ok(bytes.subarray(8, 16).every(value => value === 0));
        bytes.fill(255);
        bytes.set([ 1, 2, 3, 4 ], 0);
        glyph.bitmapData = null;
      },
    });
    effect.generateGlyphTexture(destination, { x: 2, y: 2 }, 16, glyph);
    assert.deepEqual(Array.from(destination.subarray(0, 8)),
      [ 1, 2, 3, 4, 255, 255, 255, 255 ]);
    assert.ok(destination.subarray(8, 16).every(value => value === 91));
    assert.ok(destination.subarray(16).every(value => value === 255));
    assert.ok(allocation.subarray(0, 4).every(value => value === 91));
    assert.ok(allocation.subarray(28).every(value => value === 91));
    escaped.fill(0);
    assert.equal(destination[0], 1);
    rmlui.shutdown();
    assert.deepEqual(Array.from(input.bitmapData), [ 10, 20, 30, 40 ]);
    assert.equal(escaped.length, 24);
  },

  'exception-getter-recursion-and-mutation-guards': ({ rmlui, context }) => {
    const glyph = makeGlyph(rmlui);
    const sentinel = new Error('font callback sentinel');
    for (const callbacks of [
      {
        hasUniqueTexture() {
          throw sentinel;
        },
      },
      {
        getGlyphMetrics() {
          throw sentinel;
        },
      },
      {
        generateGlyphTexture() {
          throw sentinel;
        },
      },
    ]) {
      const effect = new rmlui.FontEffect(callbacks);
      const invoke = callbacks.hasUniqueTexture ? () => effect.hasUniqueTexture
        : callbacks.getGlyphMetrics ? () => effect.getGlyphMetrics(glyph)
          : () => effect.generateGlyphTexture(
            new Uint8Array(16), { x: 2, y: 2 }, 8, glyph);
      assert.throws(invoke, error => error === sentinel);
    }
    const recursive = new rmlui.FontEffect({
      getGlyphMetrics: () => recursive.getGlyphMetrics(glyph),
    });
    assert.throws(() => recursive.getGlyphMetrics(glyph), /recursive/i);
    const getter = new rmlui.FontEffect({
      getGlyphMetrics: () => ({
        supported: true,
        get origin() {
          assert.throws(() => rmlui.shutdown(), /callback/i);
          assert.throws(() => context.update(), /callback/i);
          throw sentinel;
        },
      }),
    });
    assert.throws(() => getter.getGlyphMetrics(glyph),
      error => error === sentinel);
    for (const invalid of [ null, true, { hasUniqueTexture: 1 }]) {
      assert.throws(() => new rmlui.FontEffect(invalid), /callbacks/i);
    }
    const badBoolean = new rmlui.FontEffect({ hasUniqueTexture: () => 1 });
    assert.throws(() => badBoolean.hasUniqueTexture, /boolean/i);
    const overflow = new rmlui.FontEffect({
      getGlyphMetrics: () => ({
        supported: true, origin: { x: 2147483647, y: 0 },
        dimensions: { x: 2, y: 2 },
      }),
    });
    assert.throws(() => overflow.getGlyphMetrics(glyph), /bounds/i);
  },

  'promises-and-failed-texture-writes-are-discarded': async ({ rmlui }) => {
    const glyph = makeGlyph(rmlui);
    const sentinel = new Error('async font callback');
    const effect = new rmlui.FontEffect({
      hasUniqueTexture: () => Promise.reject(sentinel),
      getGlyphMetrics: () => Promise.reject(sentinel),
      generateGlyphTexture(bytes) {
        bytes.fill(255);
        return Promise.reject(sentinel);
      },
    });
    const bytes = new Uint8Array(16).fill(17);
    assert.throws(() => effect.hasUniqueTexture, /synchronous/i);
    assert.throws(() => effect.getGlyphMetrics(glyph), /synchronous/i);
    assert.throws(() => effect.generateGlyphTexture(
      bytes, { x: 2, y: 2 }, 8, glyph), /synchronous/i);
    assert.ok(bytes.every(value => value === 17));
    await new Promise(resolve => setImmediate(resolve));
    const transferred = new rmlui.FontEffect({
      generateGlyphTexture(scratch) {
        scratch.fill(1);
        structuredClone(scratch.buffer, { transfer: [ scratch.buffer ] });
      },
    });
    assert.throws(() => transferred.generateGlyphTexture(
      bytes, { x: 2, y: 2 }, 8, glyph), /detached/i);
    assert.ok(bytes.every(value => value === 17));
  },

  'wrapper-cycles-and-shutdown': async ({ rmlui }) => {
    let reference;
    (() => {
      const owner = {};
      owner.effect = new rmlui.FontEffect({
        hasUniqueTexture: () => Boolean(owner),
      });
      reference = new WeakRef(owner);
    })();
    await collect();
    assert.equal(reference.deref(), undefined);
    let retained;
    (() => {
      const owner = {};
      retained = new rmlui.FontEffect({
        hasUniqueTexture: () => Boolean(owner),
      });
      reference = new WeakRef(owner);
    })();
    await collect();
    assert.equal(retained.hasUniqueTexture, true);
    assert.ok(reference.deref());
    rmlui.shutdown();
    await collect();
    assert.equal(reference.deref(), undefined);
    assert.throws(() => retained.hasUniqueTexture, /initial|valid/i);
  },

  'manual-destination-transfer-and-resize': ({ rmlui }) => {
    const glyph = makeGlyph(rmlui);
    const destination = new Uint8Array(16).fill(23);
    let transferred;
    const effect = new rmlui.FontEffect({
      generateGlyphTexture(scratch) {
        scratch.fill(255);
        transferred = structuredClone(destination.buffer,
          { transfer: [ destination.buffer ] });
      },
    });
    assert.throws(() => effect.generateGlyphTexture(
      destination, { x: 2, y: 2 }, 8, glyph), /detached/i);
    assert.ok(new Uint8Array(transferred).every(value => value === 23));
    const buffer = new ArrayBuffer(16, { maxByteLength: 32 });
    const resizable = new rmlui.FontEffect({
      generateGlyphTexture(scratch) {
        scratch.fill(255);
        buffer.resize(0);
      },
    });
    assert.throws(() => resizable.generateGlyphTexture(
      new Uint8Array(buffer), { x: 2, y: 2 }, 8, glyph), /buffer/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Font effect callbacks');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('font-callbacks', 160, 120);
  try {
    await cases[name]({ sfml, rmlui, window, context });
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
    const result = spawnSync(process.execPath,
      [ '--expose-gc', __filename, name ],
      { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0 || /Leaking \w+ detected/.test(result.stderr)) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} font effect callback failures`);
}
