'use strict';

const assert = require('node:assert/strict');
const rmlui = require('../../dist');

const cases = {
  'Typed formatting preserves native ASCII and UTF8 byte lengths': () => {
    assert.equal(typeof rmlui.createString, 'function');
    assert.equal(typeof rmlui.formatString, 'function');
    assert.equal(rmlui.createString('%s:%d/%.2f', 'é中😀', 7, 1.25),
      'é中😀:7/1.25');
    assert.deepEqual(rmlui.formatString('%s:%d', 'é', 7), {
      value: 'é:7', length: 4,
    });
    assert.deepEqual(rmlui.formatString('literal %% %s', ''), {
      value: 'literal % ', length: 10,
    });
  },

  'Typed integer formatting uses native signed and unsigned domains': () => {
    assert.equal(typeof rmlui.createString, 'function');
    assert.equal(rmlui.createString('%d/%i/%u/%#x/%#o',
      -2147483648, 2147483647, 4294967295, 255, 8),
    '-2147483648/2147483647/4294967295/0xff/010');
    assert.equal(rmlui.createString('%c/%04d/%-5s', 65, 7, 'x'),
      'A/0007/x    ');
    assert.throws(() => rmlui.createString('%d', 1.5), RangeError);
    assert.throws(() => rmlui.createString('%d', 2147483648), RangeError);
    assert.throws(() => rmlui.createString('%u', -1), RangeError);
  },

  'Dynamic width and precision consume explicit typed arguments': () => {
    assert.equal(typeof rmlui.createString, 'function');
    assert.equal(rmlui.createString('%*.*f', 8, 2, 1.25), '    1.25');
    assert.equal(rmlui.createString('%*s', -5, 'x'), 'x    ');
    assert.equal(rmlui.createString('%.*s', 2, 'é中'), 'é');
    assert.equal(rmlui.createString('%.*f', -1, 1.25), '1.250000');
  },

  'Formatting preserves the native small and large NUL buffer branches': () => {
    assert.equal(typeof rmlui.formatString, 'function');
    assert.deepEqual(rmlui.formatString('%cZ', 0), { value: '', length: 2 });
    assert.deepEqual(rmlui.formatString('%sZ', 'A\0B'),
      { value: 'AZ', length: 2 });
    const long = rmlui.formatString('%260s%cZ', '', 0);
    assert.equal(long.length, 262);
    assert.equal(long.value.length, 262);
    assert.equal(long.value[260], '\0');
    assert.equal(long.value[261], 'Z');
  },

  'Unsafe C ABI formats and mismatched values are rejected': () => {
    assert.equal(typeof rmlui.createString, 'function');
    for (const format of [ '%n', '%p', '%ls', '%lld', '%1$d', '%' ]) {
      assert.throws(() => rmlui.createString(format, 7), TypeError);
    }
    assert.throws(() => rmlui.createString('%s', { toString: () => 'value' }),
      TypeError);
    assert.throws(() => rmlui.createString('%d'), TypeError);
    assert.throws(() => rmlui.createString('literal', 7), TypeError);
    assert.throws(() => rmlui.createString('%f', Infinity), RangeError);
    assert.throws(() => rmlui.createString('%1000001s', ''), RangeError);
    assert.throws(() => rmlui.createString('a\0b'), TypeError);
  },
};

let failures = 0;
for (const [ name, run ] of Object.entries(cases)) {
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${name}\n${error.stack}`);
  }
}

assert.equal(failures, 0, `${failures} formatting scenarios failed`);
