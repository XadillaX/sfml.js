# RmlUi strings and resource URLs

`StringView` retains immutable native UTF-8 bytes. All view positions are byte
offsets. `StringIteratorU8` reads native codepoints, independently of JavaScript
UTF-16 indexing. These resources and `URL` work before runtime initialization
and remain valid after shutdown.

```js
const { StringView, StringIteratorU8, StringUtilities, URL, formatString } =
  require('sfml.js-rmlui');

const text = new StringView('Aé中😀Z');
const slice = text.subview(1, 9);

console.log(slice.begin(), slice.end(), slice.toString()); // 0 9 é中😀

const input = new Int32Array([ 0, 1, 2, 3, 4, 5 ]);
const output = new Int32Array(input.length);

StringUtilities.convertCharacterOffsetsToByteOffsets(text, input, output);
console.log(Array.from(output)); // [0, 1, 3, 6, 10, 11]

const iterator = new StringIteratorU8(slice);

while (iterator.valid()) {
  console.log(iterator.offset(), iterator.value());
  iterator.increment();
}

const url = new URL('assets/panel.rml');

url.setParameter('name', 'é中😀');
console.log(url.getQueryString()); // name=%C3%A9%E4%B8%AD%F0%9F%98%80
console.log(formatString('%s:%d', 'é', 7)); // { value: 'é:7', length: 4 }
```

## Bytes, iteration and batching

`new StringView(value = '', offset = 0, count?)` copies a string into native
storage or retains an existing view's owner. The offset must be inside the
source, including its end. Count defaults to all remaining bytes and clips
at the source end. Partial UTF-8 slices are allowed. `toBytes()` returns an
independently writable snapshot; writes never change the source or its index.
`equals()` compares every byte, including bytes after NUL.

`new StringIteratorU8(value, offset = 0, count?)` retains its input. Offset
must match a cached byte boundary. Count limits the end to `offset + count`,
clipped at the source end. The iterator caches one native index snapshot per
view; subsequent movement and reads need no native entries. End is the view
length; before-begin is `-1`. Reading either sentinel throws. Advancing end
or decrementing before-begin also throws. Aliased views compare the native
owner and absolute byte position.

Reuse a `StringView` and equal-length, fixed, unshared `Int32Array` input and
output for batched offset conversion. One native call processes the batch.
Omitting output creates an independent native snapshot. Overlapping views
preserve the original input values. Negative offsets clamp to zero; oversized
offsets clamp to the end; interior bytes round toward the next codepoint.
Detached, shared and resizable arrays are rejected.

## Native string rules

Case conversion folds ASCII only. Whitespace is CR, LF, space and tab.
RML decoding is single-pass. Empty replacement search is a no-op.
`expandString(value, delimiter = ',', quoteOrIgnore = false, unquote?,
ignoreRepeatedDelimiters = false)` removes default quotes but preserves
custom quotes. `joinString(values, delimiter = ',', initial = '')` appends
to initial text; NUL inserts no separator.

`toUTF8` accepts one unsigned 32-bit codepoint or a fixed, unshared
`Uint32Array`. `lengthUTF8` counts non-continuation bytes, following native
rules even for malformed slices. `trimTrailingDotZeros` requires decimal
text containing a dot; invalid input throws.

## Resource URLs and formatting

`new URL(value = '')` owns a native RmlUi resource URL parser. Component
setters return native booleans. `setURL` clears previous components and
parameters; malformed input returns false and may leave partial parsed state.
`setPort` accepts a signed 32-bit integer. Parameter snapshots are independent
objects and preserve own keys such as `__proto__`. Parameter ordering follows
the native unordered map. `clearParameters` also invalidates the query cache.

`urlEncode` encodes all UTF-8 bytes, including NUL. The pinned decoder converts
`+` to space, `%GG` to `GG` and `%A` to byte `0A`. JavaScript strings replace
invalid decoded UTF-8 with replacement characters.

`createString` returns formatted text; `formatString` returns text and native
UTF-8 byte length. Typed printf supports `diuoxXfFeEgGaAcs`, `%%`, flags,
width, precision and dynamic `*`. Integers must fit their signed/unsigned
32-bit conversion; `%c` uses `0–255`; floating values must be finite.
Pointer, positional and length-modified formats throw. Format NUL is rejected.
Width, precision and complete output are each limited to one million bytes.
Output shorter than 256 bytes truncates text at NUL while preserving its
reported byte length; longer output retains NUL.
