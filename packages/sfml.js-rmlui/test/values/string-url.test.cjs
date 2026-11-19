'use strict';

const assert = require('node:assert/strict');
const rmlui = require('../../dist');

const cases = {
  'URL replacement clears previous components and cached parameters': () => {
    assert.equal(typeof rmlui.URL, 'function');
    const url = new rmlui.URL('https://user:pass@host:81/a/panel.rml?q=1');
    assert.equal(url.getHost(), 'host');
    assert.deepEqual(url.getParameters(), { q: '1' });

    assert.equal(url.setURL('other.rml'), true);
    assert.equal(url.getURL(), 'other.rml');
    assert.equal(url.getHost(), '');
    assert.equal(url.getLogin(), '');
    assert.equal(url.getPassword(), '');
    assert.deepEqual(url.getParameters(), {});

    url.setParameter('q', '2');
    assert.match(url.getURL(), /\?q=2$/);
    url.clearParameters();
    assert.equal(url.getURL(), 'other.rml');
    url.setURL('');
    assert.equal(url.getURL(), '');
  },

  'URL component edits reconstruct the native resource path': () => {
    assert.equal(typeof rmlui.URL, 'function');
    const url = new rmlui.URL();
    url.setProtocol('https');
    url.setLogin('reader');
    url.setPassword('secret');
    url.setHost('example.test');
    url.setPort(8080);
    url.setPath('assets/');
    url.prefixPath('root');
    url.setFileName('panel');
    url.setExtension('rml');

    assert.equal(url.getURL(),
      'https://reader:secret@example.test:8080/root/assets/panel.rml');
    assert.equal(url.getPathedFileName(), 'root/assets/panel.rml');
    assert.equal(url.getPort(), 8080);
    assert.equal(url.getPath(), 'root/assets/');
    assert.equal(url.getFileName(), 'panel');
    assert.equal(url.getExtension(), 'rml');
    assert.equal(new rmlui.URL('a.rml').lessThan(new rmlui.URL('b.rml')),
      true);
  },

  'URL parameters preserve hostile keys without exposing native state': () => {
    assert.equal(typeof rmlui.URL, 'function');
    const url = new rmlui.URL('panel.rml');
    const parameters = JSON.parse('{"__proto__":"x","é":"中 😀"}');
    url.setParameters(parameters);
    const snapshot = url.getParameters();
    assert.deepEqual(snapshot, parameters);
    snapshot.é = 'changed';

    assert.equal(url.getParameters().é, '中 😀');
    assert.equal(Object.getPrototypeOf(snapshot), Object.prototype);
    assert.match(url.getQueryString(), /%C3%A9=%E4%B8%AD%20%F0%9F%98%80/);
    assert.throws(() => url.setParameters({ ok: 7 }), TypeError);
    assert.equal(url.getParameters().é, '中 😀');
    assert.throws(() => url.setPort(2.5), RangeError);
    assert.throws(() => url.setHost({ toString: () => 'host' }), TypeError);
  },

  'URL codecs retain native UTF8 NUL and permissive escape rules': () => {
    assert.equal(typeof rmlui.URL, 'function');
    assert.equal(rmlui.URL.urlEncode('é中😀\0~'),
      '%C3%A9%E4%B8%AD%F0%9F%98%80%00~');
    assert.equal(rmlui.URL.urlDecode('%C3%A9%E4%B8%AD%F0%9F%98%80%00~'),
      'é中😀\0~');
    assert.equal(rmlui.URL.urlDecode('a+b%GG%A'), 'a bGG\n');
  },

  'ASCII RML and whitespace operations retain native semantics': () => {
    assert.ok(rmlui.StringUtilities);
    const strings = rmlui.StringUtilities;
    assert.equal(strings.toLower('ABC É中'), 'abc É中');
    assert.equal(strings.toUpper('abc é中'), 'ABC é中');
    assert.equal(strings.encodeRml('<>&"\''), '&lt;&gt;&amp;&quot;\'');
    assert.equal(strings.decodeRml('&amp;lt;&#x1F600;&#233;&#0;'),
      '&lt;😀é&#0;');
    assert.equal(strings.replace('ab\0ab', 'ab', 'x'), 'x\0x');
    assert.equal(strings.replace('abc', '', 'x'), 'abc');
    assert.equal(strings.replace('aba', 97, 99), 'cbc');
    assert.equal(strings.stripWhitespace(' \tA\v\r\n'), 'A\v');
    assert.equal(strings.isWhitespace('\v'), false);
    assert.equal(strings.isWhitespace('\n'), true);
    assert.equal(strings.trimTrailingDotZeros('12.3400'), '12.34');
    assert.equal(strings.trimTrailingDotZeros('12.000'), '12');
    assert.throws(() => strings.trimTrailingDotZeros('1200'), RangeError);
  },

  'List expansion distinguishes default and custom quote rules': () => {
    assert.ok(rmlui.StringUtilities);
    const strings = rmlui.StringUtilities;
    assert.deepEqual(strings.expandString(' a, "b,c",, d '),
      [ 'a', 'b,c', '', 'd' ]);
    assert.deepEqual(strings.expandString('a,,b,', ',', true), [ 'a', 'b' ]);
    assert.deepEqual(strings.expandString('a,(b,c),d', ',', '(', ')'),
      [ 'a', '(b,c)', 'd' ]);
    assert.equal(strings.joinString([ 'a', 'b' ], ',', 'prefix:'),
      'prefix:a,b');
    assert.equal(strings.joinString([ 'a', 'b' ], '\0'), 'ab');
    assert.throws(() => strings.expandString('a,b', '中'), RangeError);
  },

  'Byte views retain owners and compare bytes after embedded NUL': () => {
    assert.equal(typeof rmlui.StringView, 'function');
    const original = new rmlui.StringView('a\0b');
    const retained = original.subview(1, 2);
    assert.equal(original.equals(new rmlui.StringView('a\0c')), false);
    assert.deepEqual(Array.from(retained.toBytes()), [ 0, 98 ]);
    assert.equal(retained.toString(), '\0b');
    assert.equal(retained.size(), 2);
    assert.equal(retained.begin(), 0);
    assert.equal(retained.end(), 2);
    assert.equal(new rmlui.StringView().empty(), true);
    assert.equal(new rmlui.StringView().end(), 0);

    const copy = retained.toBytes();
    copy[1] = 99;
    assert.equal(retained.toString(), '\0b');
    assert.throws(() => original.subview(4), RangeError);
    assert.throws(() => original.subview(-1), RangeError);
    assert.throws(() => original.subview(0, 1.5), RangeError);
    assert.equal(original.subview(2, 100).toString(), 'b');
    assert.equal(rmlui.StringUtilities.startsWith(original, 'a\0'), true);
    assert.equal(rmlui.StringUtilities.endsWith(original, '\0c'), false);
    assert.equal(rmlui.StringUtilities.stringCompareCaseInsensitive(
      new rmlui.StringView('ABC É'), 'abc É'), true);
  },

  'UTF8 offsets count codepoints and round interior bytes forward': () => {
    assert.equal(typeof rmlui.StringView, 'function');
    const view = new rmlui.StringView('Aé中😀Z');
    const strings = rmlui.StringUtilities;
    assert.equal(view.size(), 11);
    assert.equal(strings.lengthUTF8(view), 5);
    assert.deepEqual(Array.from(strings.convertCharacterOffsetsToByteOffsets(
      view, new Int32Array([ -1, 0, 1, 2, 3, 4, 5, 100 ]))),
    [ 0, 0, 1, 3, 6, 10, 11, 11 ]);
    assert.deepEqual(Array.from(strings.convertByteOffsetsToCharacterOffsets(
      view, new Int32Array([ -1, 0, 1, 2, 3, 5, 6, 9, 10, 11, 100 ]))),
    [ 0, 0, 1, 2, 2, 3, 3, 4, 4, 5, 5 ]);
    assert.equal(strings.convertCharacterOffsetToByteOffset(view, 3), 6);
    assert.equal(strings.convertByteOffsetToCharacterOffset(view, 2), 2);
    assert.equal(strings.toCharacter(view, 6), 0x1f600);
    assert.equal(strings.bytesUTF8(0x1f600), 4);
    assert.equal(strings.toUTF8(new Uint32Array([ 65, 233, 0x1f600 ])),
      'Aé😀');
    assert.equal(strings.toUTF8(0x1f600), '😀');
    assert.equal(strings.bytesUTF8(0x110000), 0);
    assert.throws(() => strings.toCharacter(view, 11), RangeError);
    assert.throws(() => strings.toUTF8(-1), RangeError);
  },

  'Iterator sentinels never form dangling pointers': () => {
    assert.equal(typeof rmlui.StringIteratorU8, 'function');
    const iterator = new rmlui.StringIteratorU8('Aé中😀Z');
    const positions = [];
    const characters = [];
    while (iterator.valid()) {
      positions.push(iterator.offset());
      characters.push(iterator.value());
      iterator.increment();
    }

    assert.deepEqual(positions, [ 0, 1, 3, 6, 10 ]);
    assert.deepEqual(characters, [ 65, 233, 0x4e2d, 0x1f600, 90 ]);
    assert.equal(iterator.offset(), 11);
    assert.throws(() => iterator.value(), RangeError);
    assert.throws(() => iterator.increment(), RangeError);
    iterator.decrement();
    assert.equal(iterator.value(), 90);

    const first = new rmlui.StringIteratorU8('é');
    first.decrement();
    assert.equal(first.offset(), -1);
    assert.equal(first.valid(), false);
    first.increment();
    assert.equal(first.value(), 233);
    assert.equal(first.equals(new rmlui.StringIteratorU8('é')), false);
  },

  'Byte slices preserve truncated native UTF8 decoding': () => {
    assert.equal(typeof rmlui.StringView, 'function');
    const view = new rmlui.StringView('é中').subview(1, 3);
    assert.deepEqual(Array.from(view.toBytes()), [ 0xa9, 0xe4, 0xb8 ]);
    assert.equal(rmlui.StringUtilities.lengthUTF8(view), 1);
    assert.equal(rmlui.StringUtilities.toCharacter(view, 0), 0);
    assert.equal(rmlui.StringUtilities.toCharacter(view, 1), 0);
    assert.equal(rmlui.StringUtilities.seekForwardUTF8(view, 0), 1);
    assert.equal(rmlui.StringUtilities.seekBackwardUTF8(view, 2), 1);
  },

  'Iterator backward movement skips initial continuation bytes': () => {
    assert.equal(typeof rmlui.StringIteratorU8, 'function');
    const view = new rmlui.StringView('é中').subview(1);
    const iterator = new rmlui.StringIteratorU8(view, 1);
    iterator.decrement();
    assert.equal(iterator.offset(), -1);
    assert.equal(iterator.valid(), false);
    iterator.increment();
    assert.equal(iterator.offset(), 1);
    assert.equal(iterator.value(), 0x4e2d);

    const continuation = new rmlui.StringView('é').subview(1);
    const last = new rmlui.StringIteratorU8(continuation);
    last.increment().decrement();
    assert.equal(last.offset(), -1);
    last.increment();
    assert.equal(last.offset(), 1);
    assert.equal(last.valid(), false);
    assert.equal(rmlui.StringUtilities.seekBackwardUTF8(continuation, 0), -1);
  },

  'Offset batches reuse output and reject invalid storage atomically': () => {
    assert.equal(typeof rmlui.StringView, 'function');
    const view = new rmlui.StringView('Aé中😀Z');
    const input = new Int32Array([ 0, 2, 4 ]);
    const output = new Int32Array(3);
    const convert = rmlui.StringUtilities.convertCharacterOffsetsToByteOffsets;
    assert.equal(convert(view, input, output), output);
    assert.deepEqual(Array.from(output), [ 0, 3, 10 ]);
    assert.equal(convert(view, input, input), input);
    assert.deepEqual(Array.from(input), [ 0, 3, 10 ]);

    output.fill(77);
    assert.throws(() => convert(view, new Float32Array([ 1 ]), output),
      TypeError);
    assert.throws(() => convert(view, new Int32Array(4), output), RangeError);
    assert.deepEqual(Array.from(output), [ 77, 77, 77 ]);
    const detached = new Int32Array(3);
    structuredClone(detached.buffer, { transfer: [ detached.buffer ] });
    assert.throws(() => convert(view, detached, output), RangeError);
  },

  'Overlapping offset subarrays preserve the original input': () => {
    assert.equal(typeof rmlui.StringView, 'function');
    const view = new rmlui.StringView('Aé中😀Z');
    const backing = new Int32Array([ 0, 1, 2, 3, 77 ]);
    const input = backing.subarray(0, 4);
    const output = backing.subarray(1, 5);
    rmlui.StringUtilities.convertCharacterOffsetsToByteOffsets(
      view, input, output);
    assert.deepEqual(Array.from(backing), [ 0, 0, 1, 3, 6 ]);

    const shared = new Int32Array(new SharedArrayBuffer(16));
    assert.throws(() =>
      rmlui.StringUtilities.convertCharacterOffsetsToByteOffsets(
        view, shared, new Int32Array(4)), TypeError);
    assert.deepEqual(Array.from(shared), [ 0, 0, 0, 0 ]);
  },

  'Iterator equality follows the retained owner across aliased views': () => {
    assert.equal(typeof rmlui.StringIteratorU8, 'function');
    const view = new rmlui.StringView('Aé中');
    const original = new rmlui.StringIteratorU8(view, 1);
    const alias = new rmlui.StringIteratorU8(view.subview(1));
    assert.equal(original.equals(alias), true);
    assert.equal(original.equals(new rmlui.StringIteratorU8(view)), false);
    assert.throws(() => new rmlui.StringIteratorU8(view, 2), RangeError);
  },

  'Native owners survive source collection and runtime shutdown': () => {
    assert.equal(typeof rmlui.StringView, 'function');
    let source = new rmlui.StringView('Aé中😀Z');
    const slice = source.subview(1, 9);
    const iterator = new rmlui.StringIteratorU8(slice);
    source = null;
    if (global.gc) {
      global.gc();
    }
    rmlui.shutdown();

    assert.equal(slice.toString(), 'é中😀');
    assert.equal(iterator.value(), 233);
    iterator.increment();
    assert.equal(iterator.value(), 0x4e2d);
    assert.equal(new rmlui.URL('panel.rml').getURL(), 'panel.rml');
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

assert.equal(failures, 0, `${failures} String/URL scenarios failed`);
