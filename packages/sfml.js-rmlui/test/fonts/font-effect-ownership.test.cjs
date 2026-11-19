'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let i = 0; i < 16; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

function makeValue(rmlui, owner = {}) {
  const effect = new rmlui.FontEffect({
    hasUniqueTexture: () => Boolean(owner),
  });
  effect.fingerprint = 123n;
  return new rmlui.FontEffectList([ effect ], 'owned');
}

function makeProperty(rmlui, owner) {
  return new rmlui.Property(makeValue(rmlui, owner), rmlui.Unit.FONTEFFECT);
}

const cases = {
  'list-retains-callbacks-after-wrapper-collection': async ({ rmlui }) => {
    let value;
    let reference;
    (() => {
      const owner = {};
      reference = new WeakRef(owner);
      value = makeValue(rmlui, owner);
    })();
    await collect();
    assert.ok(reference.deref(), 'a retained list owns the callback closure');
    assert.equal(value.list[0].hasUniqueTexture, true);
    assert.equal(value.list[0].fingerprint, 123n);
    value.list = [];
    await collect();
    assert.equal(reference.deref(), undefined);
  },

  'list-writes-and-property-snapshots-have-independent-edges':
    async ({ rmlui }) => {
      let list;
      let property;
      let reference;
      (() => {
        const owner = {};
        reference = new WeakRef(owner);
        list = makeValue(rmlui, owner);
        property = new rmlui.Property(list, rmlui.Unit.FONTEFFECT);
      })();
      list.value = 'changed';
      list.list = [];
      await collect();
      assert.ok(reference.deref());
      assert.equal(property.value.value, 'owned');
      assert.equal(property.value.list[0].hasUniqueTexture, true);
      property.value = new rmlui.FontEffectList();
      await collect();
      assert.equal(reference.deref(), undefined);
      (() => {
        const owner = {};
        reference = new WeakRef(owner);
        list.list = makeValue(rmlui, owner).list;
      })();
      await collect();
      assert.equal(list.list[0].hasUniqueTexture, true);
      list.list = [];
      await collect();
      assert.equal(reference.deref(), undefined);
    },

  'dictionary-copies-retain-ordinary-and-custom-properties':
    async ({ rmlui }) => {
      const dictionary = new rmlui.PropertyDictionary();
      let reference;
      (() => {
        const owner = {};
        reference = new WeakRef(owner);
        const source = new rmlui.PropertyDictionary();
        const property = makeProperty(rmlui, owner);
        source.setProperty(rmlui.PropertyId.FontEffect, property);
        source.setCustomProperty('--font', property);
        dictionary.import(source);
        source.clear();
      })();
      await collect();
      assert.ok(reference.deref());
      assert.equal(dictionary.getProperty(rmlui.PropertyId.FontEffect)
        .value.list[0].hasUniqueTexture, true);
      dictionary.removeProperty(rmlui.PropertyId.FontEffect);
      await collect();
      assert.equal(dictionary.getCustomProperty('--font')
        .value.list[0].hasUniqueTexture, true);
      dictionary.clear();
      await collect();
      assert.equal(reference.deref(), undefined);
    },

  'nested-declarations-retain-font-callbacks': async ({ rmlui }) => {
    let value;
    let reference;
    (() => {
      const owner = {};
      reference = new WeakRef(owner);
      const declaration = new rmlui.DecoratorDeclaration();
      // A named decorator has no instancer-local schema until resolution.
      declaration.type = 'named-font-owner';
      declaration.properties = [{
        id: rmlui.PropertyId.FontEffect,
        name: 'font-effect',
        property: makeProperty(rmlui, owner),
      }];
      value = new rmlui.DecoratorList([ declaration ]);
    })();
    await collect();
    assert.ok(reference.deref());
    assert.equal(value.list[0].properties[0].property
      .value.list[0].hasUniqueTexture, true);
    value.list = [];
    await collect();
    assert.equal(reference.deref(), undefined);
  },

  'standalone-owner-cycles-are-collectable': async ({ rmlui }) => {
    const references = [];
    for (const kind of [ 'list', 'property', 'dictionary', 'declaration' ]) {
      (() => {
        const owner = {};
        references.push(new WeakRef(owner));
        if (kind === 'list') {
          owner.value = makeValue(rmlui, owner);
        } else if (kind === 'property') {
          owner.value = makeProperty(rmlui, owner);
        } else if (kind === 'dictionary') {
          owner.value = new rmlui.PropertyDictionary();
          owner.value.setCustomProperty('--cycle', makeProperty(rmlui, owner));
        } else {
          const declaration = new rmlui.DecoratorDeclaration();
          declaration.type = 'cycle';
          declaration.properties = [{
            id: rmlui.PropertyId.FontEffect,
            name: 'font-effect',
            property: makeProperty(rmlui, owner),
          }];
          owner.value = new rmlui.DecoratorList([ declaration ]);
        }
      })();
    }
    await collect();
    assert.ok(references.every(reference => reference.deref() === undefined));
  },

  'shutdown-releases-callbacks-from-retained-value-owners':
    async ({ rmlui, window }) => {
      let value;
      let property;
      let reference;
      (() => {
        const owner = {};
        reference = new WeakRef(owner);
        value = makeValue(rmlui, owner);
        property = new rmlui.Property(value, rmlui.Unit.FONTEFFECT);
      })();
      await collect();
      assert.ok(reference.deref());
      rmlui.shutdown();
      await collect();
      assert.equal(reference.deref(), undefined);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.throws(() => value.list, /valid/i);
      assert.throws(() => property.value, /valid/i);
      assert.equal(makeValue(rmlui).list[0].hasUniqueTexture, true);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Font effect ownership');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({ rmlui, window });
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
  assert.equal(failures, 0, `${failures} font effect ownership failures`);
}
