'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const sfml = require('sfml.js');
const rmlui = require('../../dist');

/**
 * Register a listener recording actual native identities and phases.
 * @param {object} result Result under construction.
 * @param {object} current Listener element.
 * @param {object} target Expected event target.
 * @param {string} type Event type.
 * @param {string} label Trace label.
 * @param {boolean} capture Capture-phase registration.
 * @param {Function} action Additional listener action.
 * @return {Function} Registered listener.
 */
function listen(result, current, target, type, label, capture, action) {
  const listener = event => {
    assert.strictEqual(event.currentTarget, current);
    assert.strictEqual(event.target, target);
    result.calls.push([ label, event.phase ]);
    if (action) {
      action(event);
    }
  };
  current.addEventListener(type, listener, capture);
  return listener;
}

/**
 * Observe the eight native event-oracle scenarios through the public binding.
 * @param {object} context Owning context.
 * @param {string} name Scenario name.
 * @return {object} Dispatch result and ordered phase trace.
 */
function observe(context, name) {
  const document = context.loadDocumentFromMemory(
    '<rml><head/><body><section><button/></section></body></rml>');
  const parent = document.querySelector('section');
  const child = parent.querySelector('button');
  const result = { result: false, calls: [] };

  if (name.endsWith('-id-phases')) {
    if (name === 'duplicate-id-phases') {
      parent.id = 'duplicate';
      child.id = 'duplicate';
    }
    listen(result, document, child, 'phases', 'document-capture', true);
    const capture = listen(result, parent, child,
      'phases', 'parent-capture', true);
    listen(result, child, child, 'phases', 'target-capture', true);
    const target = listen(result, child, child, 'phases', 'target', false);
    listen(result, parent, child, 'phases', 'parent', false);
    listen(result, document, child, 'phases', 'document', false);
    child.addEventListener('phases', target);
    parent.removeEventListener('phases', capture, false);
    result.result = child.dispatchEvent('phases');
  } else if (name.startsWith('stop-') || name.startsWith('uninterruptible')) {
    const interruptible = name.startsWith('stop-');
    const immediate = name !== 'stop-propagation';
    const bubbles = name !== 'uninterruptible-no-bubble';
    listen(result, parent, child, 'stops', 'first', true, event => {
      assert.equal(event.isInterruptible, interruptible);
      if (immediate) {
        event.stopImmediatePropagation();
      } else {
        event.stopPropagation();
      }
      assert.equal(event.isPropagating, !interruptible);
      assert.equal(event.isImmediatePropagating,
        !(interruptible && immediate));
    });
    listen(result, parent, child, 'stops', 'second', true);
    listen(result, child, child, 'stops', 'target', false);
    listen(result, parent, child, 'stops', 'bubble', false);
    result.result = child.dispatchEvent('stops', {}, {
      interruptible, bubbles,
    });
  } else if (name === 'remove-current-and-later') {
    let later;
    const current = listen(result, child, child,
      'removal', 'first', false, () => {
        child.removeEventListener('removal', current);
        child.removeEventListener('removal', later);
      });
    later = listen(result, child, child, 'removal', 'later', false);
    listen(result, parent, child, 'removal', 'bubble', false);
    result.result = child.dispatchEvent('removal');
  } else {
    assert.equal(name, 'nested-dispatch');
    let outer;
    listen(result, parent, parent, 'inner', 'inner', false, event => {
      assert.notStrictEqual(event, outer);
      assert.notEqual(event.id, outer.id);
      assert.equal(outer.isPropagating, true);
    });
    listen(result, child, child, 'outer', 'before', false, event => {
      outer = event;
      assert.equal(parent.dispatchEvent('inner'), true);
      assert.equal(event.isPropagating, true);
      event.stopPropagation();
      result.calls.push([ 'after', event.phase ]);
    });
    result.result = child.dispatchEvent('outer');
    assert.throws(() => outer.stopPropagation(), /expired/i);
  }

  document.unload();
  context.update();
  return result;
}

assert.ok(process.argv[2], 'Supply the native event-order reference JSON');
const reference = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(Object.keys(reference).length, 8);
const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(32, 32)), 'Native event contracts');
assert.ok(rmlui.initialise(window, { highDpi: false }));

try {
  const context = rmlui.createContext('event-oracle', 32, 32);
  for (const [ name, expected ] of Object.entries(reference)) {
    assert.deepEqual(observe(context, name), expected, name);
    console.log(`PASS binding-native-event-${name}`);
  }
  context.remove();
} finally {
  rmlui.shutdown();
  window.close();
}
