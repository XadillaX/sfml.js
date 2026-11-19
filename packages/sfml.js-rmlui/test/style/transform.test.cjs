'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { Worker } = require('node:worker_threads');

function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-5, `${actual} != ${expected}`);
}

const cases = {
  'transform-native-constructors-cover-all-primitive-types': function({ r }) {
    const { TransformPrimitiveType: T, Unit: U } = r;
    const sizes = [ 6, 16, 1, 1, 1, 2, 3, 1, 1, 1, 2, 3,
      1, 1, 1, 1, 4, 1, 1, 2, 1 ];
    for (let type = 0; type < sizes.length; type++) {
      const length = sizes[type];
      const unresolved = type >= T.TRANSLATEX && type <= T.TRANSLATE3D ||
        type === T.PERSPECTIVE;
      const angle = type >= T.ROTATEX && type <= T.SKEW2D;
      const values = Array.from({ length }, (_, i) => ({
        number: angle ? 90 : i + 1,
        unit: unresolved ? U.PERCENT : angle ? U.DEG : U.NUMBER,
      }));
      if (type === T.ROTATE3D) {
        values.splice(0, 3, { number: 0, unit: U.NUMBER },
          { number: 0, unit: U.NUMBER }, { number: 1, unit: U.NUMBER });
      }
      const primitive = r.makeTransformPrimitive(type, values);
      assert.equal(primitive.type, type);
      for (let i = 0; i < length; i++) {
        if (unresolved) {
          assert.deepEqual(primitive.values[i], values[i]);
        } else {
          const angular = angle && (type !== T.ROTATE3D || i === 3);
          near(primitive.values[i], angular ? Math.PI / 2 : values[i].number);
        }
      }
      const transform = new r.Transform([ primitive ]);
      assert.deepEqual(transform.getPrimitive(0), primitive);
      assert.deepEqual(new r.Transform(transform.primitives).primitives,
        [ primitive ]);
    }
    const decomposed = {
      type: T.DECOMPOSEDMATRIX4,
      perspective: { x: 0, y: 0, z: 0, w: 1 },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      translation: { x: 1, y: 2, z: 3 },
      scale: { x: 1, y: 2, z: 1 },
      skew: { x: 0.1, y: 0, z: 0 },
    };
    const result = new r.Transform([ decomposed ]).getPrimitive(0);
    assert.equal(result.type, T.DECOMPOSEDMATRIX4);
    near(result.skew.x, 0.1);
    for (const field of [
      'perspective', 'quaternion', 'translation', 'scale', 'skew',
    ]) {
      for (const [ key, value ] of Object.entries(decomposed[field])) {
        assert.equal(result[field][key], Math.fround(value));
      }
    }
    const percent = r.makeTransformPrimitive(T.ROTATEZ,
      [ new r.NumericValue(25, U.PERCENT) ]);
    near(percent.values[0], Math.PI / 2);
  },

  'transform-list-mutation-is-native-owned-and-atomic': function({ r }) {
    const T = r.TransformPrimitiveType;
    const input = { type: T.SCALE2D, values: [ 2, 3 ] };
    const transform = new r.Transform();
    assert.equal(transform.getNumPrimitives(), 0);
    transform.addPrimitive(input);
    input.values[0] = 99;
    assert.deepEqual(transform.getPrimitive(0).values, [ 2, 3 ]);
    const copy = transform.primitives;
    copy[0].values[0] = 88;
    copy.length = 0;
    assert.equal(transform.getNumPrimitives(), 1);
    for (const invalid of [
      { type: -1, values: [] },
      { type: T.SCALE2D, values: [ 1 ] },
      { type: T.SCALE2D, values: [ 1, Infinity ] },
      { type: T.TRANSLATEX, values: [{ number: 2, unit: -1 }] },
      { type: T.DECOMPOSEDMATRIX4 },
    ]) {
      assert.throws(() => transform.addPrimitive(invalid));
      assert.throws(() => {
        transform.primitives = [ input, invalid ];
      });
      assert.deepEqual(transform.getPrimitive(0).values, [ 2, 3 ]);
      assert.equal(transform.getNumPrimitives(), 1);
    }
    for (const index of [ -1, 1, 0.5, NaN, 2 ** 32 ]) {
      assert.throws(() => transform.getPrimitive(index), /index/i);
    }
    transform.primitives = [{ type: T.SCALEX, values: [ 5 ] }];
    assert.deepEqual(transform.getPrimitive(0).values, [ 5 ]);
    transform.clearPrimitives();
    assert.deepEqual(transform.primitives, []);
  },

  'transform-property-parsing-snapshots-and-defaults': function({
    r, target, context,
  }) {
    assert.ok(target.setProperty('transform',
      'translate(50%, 2em) rotate(90deg) scale(2, 3) perspective(400px)'));
    const property = target.getProperty('transform');
    const snapshot = property.value;
    assert.equal(snapshot.type, 'transform');
    assert.deepEqual(snapshot.primitives.map(p => p.type),
      [ 5, 15, 10, 20 ]);
    assert.deepEqual(snapshot.primitives[0].values,
      [{ number: 50, unit: r.Unit.PERCENT },
        { number: 2, unit: r.Unit.EM }]);
    near(snapshot.primitives[1].values[0], Math.PI / 2);
    snapshot.primitives[0].values[0].number = 20;
    assert.equal(property.value.primitives[0].values[0].number, 50);
    const made = r.Transform.makeProperty(snapshot.primitives);
    assert.equal(made.unit, r.Unit.TRANSFORM);
    assert.equal(made.definition.id, r.PropertyId.Transform);
    assert.ok(target.setProperty(r.PropertyId.Transform, made));
    assert.ok(context.update());
    assert.ok(context.render());
    assert.equal(target.getProperty('transform').value
      .primitives[0].values[0].number, 20);
    assert.deepEqual(property.get({ type: 'transform', primitives: [] }),
      property.value);
    const emptyPointer = { type: 'transform', primitives: null };
    assert.deepEqual(new r.Property('invalid').get(snapshot), emptyPointer);
    assert.deepEqual(new r.Property(emptyPointer, r.Unit.TRANSFORM).value,
      emptyPointer);
    assert.ok(property.equals(property.clone()), 'native shared pointer');
    assert.equal(property.equals(
      new r.Property(property.value, r.Unit.TRANSFORM)), false);
  },

  'transform-attribute-and-event-round-trips': function({ r, target }) {
    const transform = new r.Transform([
      { type: r.TransformPrimitiveType.SCALEX, values: [ 2 ] },
    ]);
    target.setAttribute('transform-value', transform);
    transform.clearPrimitives();
    const snapshot = target.getAttributeValue('transform-value');
    assert.deepEqual(snapshot.primitives[0].values, [ 2 ]);
    assert.deepEqual(target.getAttribute('transform-value', transform),
      snapshot);
    assert.deepEqual(target.getAttribute('absent', transform),
      { type: 'transform', primitives: [] });
    let saved;
    target.addEventListener('probe', event => {
      saved = event.parameters.transform;
      assert.deepEqual(event.getParameter('transform', transform), snapshot);
    });
    target.dispatchEvent('probe', { transform: snapshot });
    assert.deepEqual(saved, snapshot);
  },

  'transform-accessors-propagate-errors-and-check-receiver-lifetime': function({
    r, target,
  }) {
    const marker = new Error('primitive getter');
    const bad = {
      type: r.TransformPrimitiveType.SCALEX,
      get values() {
        throw marker;
      },
    };
    assert.throws(() => new r.Transform([ bad ]), e => e === marker);
    const input = {
      type: 'transform',
      get primitives() {
        r.shutdown();
        return [];
      },
    };
    assert.throws(() => target.setAttribute('value', input),
      /initialised|valid/i);
  },

  'transform-independent-values-survive-shutdown-and-gc': async function({
    r, target,
  }) {
    let transform = new r.Transform([
      { type: r.TransformPrimitiveType.SCALEX, values: [ 2 ] },
    ]);
    const weak = new WeakRef(transform);
    const property = new r.Property(transform, r.Unit.TRANSFORM);
    const snapshot = property.value;
    target.setAttribute('transform-value', snapshot);
    transform = null;
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    r.shutdown();
    assert.throws(() => property.value, /initialised|valid/i);
    const independent = new r.Transform(snapshot.primitives);
    independent.addPrimitive(snapshot.primitives[0]);
    assert.equal(independent.getNumPrimitives(), 2);
    assert.deepEqual(independent.getPrimitive(0), snapshot.primitives[0]);
  },

  'transform-worker-values-do-not-access-the-main-runtime': async function() {
    const worker = new Worker(`
      const assert = require('node:assert/strict');
      const { parentPort, workerData } = require('node:worker_threads');
      const r = require(workerData);
      const T = r.TransformPrimitiveType;
      const rotate = r.makeTransformPrimitive(T.ROTATE2D,
        [{ number: 90, unit: r.Unit.DEG }]);
      const value = new r.Transform([rotate]);
      assert.ok(Math.abs(value.getPrimitive(0).values[0] - Math.PI / 2) < 1e-5);
      value.addPrimitive({ type: T.SCALE2D, values: [2, 3] });
      assert.equal(value.getNumPrimitives(), 2);
      value.primitives = [value.getPrimitive(1)];
      assert.deepEqual(value.primitives, [{ type: T.SCALE2D, values: [2, 3] }]);
      assert.throws(() => r.Transform.makeProperty(value.primitives),
        /owning.*(environment|thread)/i);
      value.clearPrimitives();
      assert.equal(value.getNumPrimitives(), 0);
      parentPort.postMessage('independent');
    `, { eval: true, workerData: require.resolve('../../dist') });
    const messages = [];
    worker.on('message', message => messages.push(message));
    await new Promise((resolve, reject) => {
      worker.once('error', reject);
      worker.once('exit', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`worker exit ${code}`));
        }
      });
    });
    assert.deepEqual(messages, [ 'independent' ]);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const r = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Transform values');
  assert.ok(r.initialise(window, { highDpi: false }));
  try {
    const context = r.createContext('transform-values', 320, 240);
    const document = context.loadDocumentFromMemory(`
      <rml><body><div id="target" style="width:40px;height:20px"/>
      </body></rml>`);
    document.show();
    context.update();
    await cases[name]({
      r, context, document, target: document.getElementById('target'),
    });
  } finally {
    r.shutdown();
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
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} transform regressions failed`);
}
