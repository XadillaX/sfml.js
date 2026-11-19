'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function run(tag, failure, route) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Context construction');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('existing', 160, 120);
    const rootAllocator = rmlui.Factory.getElementInstancer('*');
    const allocator = rmlui.Factory.getElementInstancer(tag);
    const error = new Error(`Element allocation failed: ${tag}`);
    let partialRoot;
    let releasedRoots = 0;
    if (tag === 'body') {
      rmlui.Factory.registerElementInstancer('*',
        new rmlui.ElementInstancer((parent, name, attributes) => {
          partialRoot = rootAllocator.instanceElement(parent, name, attributes);
          return partialRoot;
        }, snapshot => {
          assert.equal(snapshot.tagName, '#root');
          ++releasedRoots;
        }));
    }
    let allocated;
    const bad = failure === 'disabled' ? null
      : new rmlui.ElementInstancer((parent, name, attributes) => {
        if (failure === 'exception') {
          throw error;
        }
        if (failure === 'subtype') {
          allocated = rootAllocator.instanceElement(parent, name, attributes);
          return allocated;
        }
        return null;
      });
    rmlui.Factory.registerElementInstancer(tag, bad);
    const custom = new rmlui.ContextInstancer();
    if (route === 'registered-custom') {
      rmlui.Factory.registerContextInstancer(custom);
    }
    const create = route === 'owned'
      ? () => custom.instanceContext('failed', context.getRenderManager(), null)
      : () => rmlui.createContext('failed', 160, 120);
    assert.throws(create, failure === 'exception'
      ? value => value === error : /context|root|document|element/i);
    assert.equal(rmlui.getContext('failed'), null);
    assert.equal(rmlui.getNumContexts(), 1);
    if (allocated) {
      assert.throws(() => allocated.tagName, /valid/i);
    }
    if (partialRoot) {
      // The first uncaught host error suppresses later JS notifications in
      // that boundary; native ownership must still destroy the partial root.
      assert.equal(releasedRoots, failure === 'exception' ? 0 : 1);
      assert.throws(() => partialRoot.tagName, /valid/i);
      rmlui.Factory.registerElementInstancer('*', rootAllocator);
    }
    rmlui.Factory.registerElementInstancer(tag, allocator);
    const recovered = rmlui.createContext('recovered', 160, 120);
    assert.equal(recovered.update(), true);
    assert.equal(recovered.remove(), true);
    assert.equal(context.update(), true);
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(...process.argv.slice(2));
} else {
  let failures = 0;
  for (const tag of [ '*', 'body' ]) {
    const scenarios = [ 'disabled', 'null', 'exception' ];
    if (tag === 'body') {
      scenarios.push('subtype');
    }
    for (const scenario of scenarios) {
      for (const route of [ 'registered', 'registered-custom', 'owned' ]) {
        const name = `${tag}:${scenario}:${route}`;
        const result = spawnSync(process.execPath,
          [ __filename, tag, scenario, route ], {
            encoding: 'utf8', timeout: 15000,
          });
        if (result.status !== 0) {
          ++failures;
          console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
            result.error ?? '', result.stdout, result.stderr);
        } else {
          console.log(`PASS ${name}`);
        }
      }
    }
  }
  assert.equal(failures, 0, `${failures} context construction failures`);
}
