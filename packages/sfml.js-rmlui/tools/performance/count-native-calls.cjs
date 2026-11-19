'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const rmlui = require('../../build/Release/rmlui.node');
const sfml = require(path.resolve(path.dirname(require.resolve('sfml.js')),
  '../build/Release/sfml.node'));

/**
 * Count calls to both actual addon exports, including unguarded value APIs.
 * Run separately from malloc counts and timing: JS wrappers allocate scratch.
 * Native-internal calls stay in C++ and do not pass through these exports.
 *
 * @param {Function} action - One complete frame to observe.
 * @return {object} Actual addon entries, method inventory and reverse counts.
 */
module.exports = function countNativeCalls(action) {
  const counts = {};
  const originals = [];
  let nativeCounts;
  const controls = new Set([ 'beginDataDiagnostics', 'endDataDiagnostics' ]);
  try {
    for (const [ name, binding ] of Object.entries({ rmlui, sfml })) {
      const group = { total: 0, methods: {} };
      counts[name] = group;
      for (const [ key, method ] of Object.entries(binding)) {
        if (typeof method !== 'function' || controls.has(key)) {
          continue;
        }
        const descriptor = Object.getOwnPropertyDescriptor(binding, key);
        assert.ok(descriptor.writable, `Cannot observe ${name}.${key}`);
        originals.push([ binding, key, descriptor ]);
        binding[key] = function(...args) {
          ++group.total;
          group.methods[key] = (group.methods[key] ?? 0) + 1;
          return Reflect.apply(method, this, args);
        };
      }
    }
    rmlui.beginDataDiagnostics(false);
    try {
      action();
    } finally {
      nativeCounts = rmlui.endDataDiagnostics();
    }
  } finally {
    for (const [ binding, key, descriptor ] of originals) {
      Object.defineProperty(binding, key, descriptor);
    }
  }
  assert.ok(counts.rmlui.total >= nativeCounts.runtimeEntries);
  assert.equal(nativeCounts.mallocTracking, false);
  return { ...counts,
    totalJsToNative: counts.rmlui.total + counts.sfml.total,
    nativeToJs: nativeCounts.nativeCallbacks,
    callbacks: nativeCounts.callbacks,
    guardedRmluiEntries: nativeCounts.runtimeEntries,
  };
};
