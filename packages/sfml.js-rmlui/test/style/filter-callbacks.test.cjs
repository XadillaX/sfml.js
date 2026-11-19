'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let i = 0; i < 16; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'direct-virtuals-and-move': ({ rmlui, element }) => {
    let original;
    const filter = new rmlui.Filter({
      compileFilter(target) {
        original = target.getRenderManager().compileFilter('blur', {
          sigma: 1,
        });
        return original;
      },
      extendInkOverflow(target, overflow) {
        assert.equal(target.handle, element.handle);
        overflow.p0.x -= 3;
        overflow.p1.y += 5;
        return overflow;
      },
    });
    const compiled = filter.compileFilter(element);
    assert.equal(compiled.isValid, true);
    assert.equal(original.isValid, false);
    original.release();
    assert.equal(compiled.isValid, true);
    compiled.release();
    const input = {
      p0: { x: 1, y: 2 },
      p1: { x: 4, y: 6 },
    };
    const overflow = filter.extendInkOverflow(element, input);
    assert.equal(overflow.p0.x, -2);
    assert.equal(overflow.p1.y, 11);
    assert.equal(input.p0.x, 1);
    const empty = new rmlui.Filter({
      compileFilter: () => new rmlui.CompiledFilter(),
    });
    assert.equal(empty.compileFilter(element).isValid, false);
    assert.deepEqual(empty.extendInkOverflow(element, input), input);
  },

  'checked-transfer-and-callback-errors': ({ rmlui, element, context }) => {
    const other = new rmlui.RenderManager(rmlui.getRenderInterface());
    const wrong = other.compileFilter('blur', { sigma: 1 });
    const foreign = new rmlui.Filter({ compileFilter: () => wrong });
    assert.throws(() => foreign.compileFilter(element), /manager/i);
    assert.equal(wrong.isValid, true);
    const owned = element.getRenderManager().compileFilter('blur', {
      sigma: 1,
    });
    const reuse = new rmlui.Filter({ compileFilter: () => owned });
    assert.equal(reuse.compileFilter(element).isValid, true);
    assert.throws(() => reuse.compileFilter(element), /transferred/i);
    for (const value of [ null, {}, Promise.resolve(wrong) ]) {
      const invalid = new rmlui.Filter({ compileFilter: () => value });
      assert.throws(() => invalid.compileFilter(element), /compiled filter/i);
    }
    const sentinel = new Error('filter sentinel');
    const throwing = new rmlui.Filter({
      compileFilter() {
        throw sentinel;
      },
    });
    assert.throws(() => throwing.compileFilter(element), e => e === sentinel);
    const recursive = new rmlui.Filter({
      compileFilter() {
        return recursive.compileFilter(element);
      },
    });
    assert.throws(() => recursive.compileFilter(element), /recursive/i);
    const guarded = new rmlui.Filter({
      compileFilter(target) {
        assert.equal(target.resolveLength(
          new rmlui.NumericValue(2, rmlui.Unit.PX)), 2);
        assert.equal(target.getBox().getSize().x, 40);
        assert.equal(target.getProperty('width').get(0), 40);
        assert.throws(() => target.setProperty('filter', 'none'), /callback/i);
        assert.throws(() => context.render(), /callback/i);
        assert.throws(() => rmlui.shutdown(), /callback/i);
        return target.getRenderManager().compileFilter('blur', { sigma: 1 });
      },
      extendInkOverflow() {
        return { p0: { x: Infinity, y: 0 }, p1: { x: 1, y: 1 } };
      },
    });
    assert.equal(guarded.compileFilter(element).isValid, true);
    assert.throws(() => guarded.extendInkOverflow(element, {
      p0: { x: 0, y: 0 }, p1: { x: 1, y: 1 },
    }), /finite/i);
    const invalidOverflow = new rmlui.Filter({
      compileFilter: () => new rmlui.CompiledFilter(),
      extendInkOverflow: () => undefined,
    });
    assert.throws(() => invalidOverflow.extendInkOverflow(element, {
      p0: { x: 0, y: 0 }, p1: { x: 1, y: 1 },
    }), /rectangle/i);
    assert.throws(() => new rmlui.Filter({}), /compileFilter/i);
  },

  'standalone-and-direct-instancer-cycles': async ({ rmlui, element }) => {
    const references = [];
    let alias;
    (() => {
      const owner = {};
      owner.filter = new rmlui.Filter({
        compileFilter() {
          void owner;
          return new rmlui.CompiledFilter();
        },
      });
      references.push(new WeakRef(owner));
    })();
    (() => {
      const owner = {};
      owner.filter = new rmlui.Filter({
        compileFilter(target) {
          void owner;
          return target.getRenderManager().compileFilter('blur', { sigma: 1 });
        },
      });
      const instancer = new rmlui.FilterInstancer(() => owner.filter);
      alias = instancer.instanceFilter(
        'direct', new rmlui.PropertyDictionary());
      references.push(new WeakRef(owner));
    })();
    await collect();
    assert.equal(references[0].deref(), undefined);
    assert.ok(references[1].deref());
    assert.equal(alias.compileFilter(element).isValid, true);
    alias = null;
    await collect();
    assert.equal(references[1].deref(), undefined);
  },

  'render-lease-detached-tree-and-release': async options => {
    const { rmlui, context, document } = options;
    let reference;
    let calls = 0;
    rmlui.FilterInstancer.register('managed', new rmlui.FilterInstancer(() => {
      const owner = {};
      owner.filter = new rmlui.Filter({
        compileFilter(target) {
          owner.element = target;
          ++calls;
          return target.getRenderManager().compileFilter('blur', { sigma: 2 });
        },
        extendInkOverflow(target, overflow) {
          void owner;
          overflow.p0.x -= 4;
          return overflow;
        },
      });
      reference = new WeakRef(owner);
      return owner.filter;
    }));
    let detached;
    (() => {
      const target = document.getElementById('target');
      target.setProperty('filter', 'managed()');
      context.update();
      context.render();
      detached = target;
    })();
    assert.ok(calls > 0);
    await collect();
    assert.ok(reference.deref());
    document.removeChild(detached);
    await collect();
    assert.ok(reference.deref());
    document.appendChild(detached);
    context.update();
    context.render();
    document.removeChild(detached);
    detached = null;
    await collect();
    assert.equal(reference.deref(), undefined);
  },

  'shutdown-clears-closures-and-invalidates-aliases': async options => {
    const { rmlui, element } = options;
    let stale;
    let reference;
    (() => {
      const owner = { element };
      owner.filter = new rmlui.Filter({
        compileFilter(target) {
          void owner;
          return target.getRenderManager().compileFilter('blur', { sigma: 1 });
        },
      });
      stale = owner.filter;
      reference = new WeakRef(owner);
    })();
    assert.equal(stale.compileFilter(element).isValid, true);
    rmlui.shutdown();
    await collect();
    assert.equal(reference.deref(), undefined);
    assert.throws(() => stale.compileFilter(element), /initial|valid/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Filter callbacks');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('callbacks', 160, 120);
  const document = context.loadDocumentFromMemory(
    '<rml><head/><body><div id="target" ' +
    'style="display:block;width:40px;height:40px;background:#f00;"/>' +
    '</body></rml>');
  document.show();
  context.update();
  try {
    const options = { rmlui, context, document };
    if (name !== 'render-lease-detached-tree-and-release') {
      options.element = document.getElementById('target');
    }
    await cases[name](options);
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
  assert.equal(failures, 0, `${failures} filter callback failures`);
}
