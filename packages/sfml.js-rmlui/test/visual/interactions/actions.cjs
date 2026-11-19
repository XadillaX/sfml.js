'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { BoxArea } = require('../../../dist');

/**
 * Resolve an unchanged DOM path without assigning IDs or modifying markup.
 * @param {object} document Live document.
 * @param {string} target DOM child-index path.
 */
function element(document, target) {
  let result = document;
  for (const index of target.split('/').slice(1)) {
    result = result.getChild(Number(index));
    assert.ok(result, target);
  }
  return result;
}

/**
 * Read the same literal TSV operations used by the native GL3 executable.
 * @param {string} filename Input manifest.
 */
function load(filename) {
  const result = new Map();
  for (const line of fs.readFileSync(filename, 'utf8').trim().split('\n')) {
    const [ name, ...action ] = line.split('\t');
    if (!result.has(name)) {
      result.set(name, []);
    }
    result.get(name).push(action);
  }
  return result;
}

/**
 * Run native input and layout operations, then capture requested checkpoints.
 * @param {object} options Context, document, clock and capture callback.
 * @param {object} options.context Live native context.
 * @param {object} options.document Unchanged upstream document.
 * @param {object} options.system Deterministic system clock.
 * @param {string[][]} options.actions Literal input sequence.
 * @param {Function} options.capture Capture checkpoint.
 */
async function run({ context, document, system, actions, capture }) {
  let pointer = [ -1, -1 ];
  for (const [ verb, target, first, second ] of actions) {
    switch (verb) {
      case 'hover': {
        const item = element(document, target);
        const offset = item.getAbsoluteOffset(BoxArea.Border);
        const size = item.getBox().getSize(BoxArea.Border);
        pointer = [ Math.floor(offset.x + size.x / 2),
          Math.floor(offset.y + size.y / 2) ];
        context.processMouseMove(...pointer);
        break;
      }
      case 'hit': {
        const item = element(document, target);
        let found = false;
        for (let y = 4; y < 768 && !found; y += 4) {
          for (let x = 4; x < 1024; x += 4) {
            if (context.getElementAtPoint({ x, y }) === item) {
              pointer = [ x, y ];
              found = true;
              break;
            }
          }
        }
        assert.ok(found, `No visible hit point for ${target}`);
        context.processMouseMove(...pointer);
        break;
      }
      case 'mouse':
        pointer = [ Number(target), Number(first) ];
        context.processMouseMove(...pointer);
        break;
      case 'move-by':
        pointer = [ pointer[0] + Number(target), pointer[1] + Number(first) ];
        context.processMouseMove(...pointer);
        break;
      case 'down':
        context.processMouseButtonDown(0);
        break;
      case 'up':
        context.processMouseButtonUp(0);
        break;
      case 'wheel':
        context.processMouseWheel({ x: Number(target), y: Number(first) });
        break;
      case 'advance':
        // RmlUi clamps animation dt. Feed elapsed time at 60Hz so the
        // declared duration actually finishes before an endpoint capture.
        while (system.clock[0] < Number(target)) {
          system.clock[0] = Math.min(
            system.clock[0] + 1 / 60, Number(target));
          assert.ok(context.update());
        }
        break;
      case 'scroll': {
        const item = element(document, target);
        item.scrollLeft = Number(first);
        item.scrollTop = Number(second);
        break;
      }
      case 'size':
        context.setDimensions(Number(target), Number(first));
        break;
      case 'density':
        context.setDensityIndependentPixelRatio(Number(target));
        break;
      case 'focus':
        assert.ok(element(document, target).focus());
        break;
      case 'key':
        context.processKeyDown(Number(target));
        context.processKeyUp(Number(target));
        break;
      case 'property':
        assert.ok(element(document, target).setProperty(first, second));
        break;
      case 'capture':
        await capture(target, pointer);
        break;
      default:
        throw new Error(`Unknown operation: ${verb}`);
    }
    assert.ok(context.update());
  }
}

module.exports = { load, run };
