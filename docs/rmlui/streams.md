# RmlUi byte streams

`StreamMemory`, `StreamFile` and `Stream` implement RmlUi's byte stream
interface. `context.loadDocument(stream)` and
`container.loadStyleSheetContainer(stream)` parse from the current cursor.
Set the source URL before parsing so relative RCSS, image and font paths use
the document's origin. An RML `<head>` stores that URL on the loaded document.

```js
const { StreamMemory, SeekOrigin, StyleSheetContainer } = require('sfml.js-rmlui');
const source = new StreamMemory(Buffer.from(
  '<rml><head/><body id="panel"/></rml>'));

source.setSourceURL('/application/assets/panel.rml');
const document = context.loadDocument(source);

const rules = new StreamMemory(Buffer.from('#panel { width: 240px; }'));

rules.setSourceURL('/application/assets/panel.rcss');
const container = new StyleSheetContainer();

container.loadStyleSheetContainer(rules);
document.setStyleSheetContainer(container);

source.seek(0, SeekOrigin.Set);
console.log(source.readString(5)); // <rml>
```

## Memory and file storage

`new StreamMemory()` creates writable native storage with an initial capacity
of 256 bytes. A numeric argument selects capacity; length still starts at zero.
A `Uint8Array` argument creates a native-owned, read-only snapshot of that
view's bytes. Detaching or modifying the original view cannot change the stream.
Every modifying method rejects a read-only snapshot.

`read(count)` and `peek(count)` return independent arrays. Their view overloads
return the byte count and modify only the destination view's range.
`rawStream()` copies all used bytes, independently of the cursor. The returned
array remains valid after a reallocation or shutdown.

`write(string)` preserves embedded null characters; `writeCString(string)`
stops at the first null. `readString(count, initial)` appends decoded UTF-8,
including null characters. Counts refer to bytes, not JavaScript characters.
Stream-to-stream copying returns the source byte count even when a custom
destination performs a short write, following native RmlUi behavior.

Memory streams preserve RmlUi's unusual end-relative seek:
`seek(offset, SeekOrigin.End)` targets `length - offset`. File streams use
`length + offset`. Custom streams define that convention in their callback.
Memory erasure clamps an existing cursor to the new length. Front removal
moves it back without passing zero. Oversized pop counts remove at most the
current length. Truncation moves a memory cursor to the new end.

`new StreamFile()` starts unopened. `open(path)` uses the installed RmlUi file
interface and releases any previous file handle. File streams are read-only.
After `close()`, open the file again before reading, seeking or querying its
position. Shutdown automatically releases every open file before destroying
the file interface.

Byte batches and memory capacities must be integers in `[0, 2147483647]`.
Detached, shared and resizable byte buffers are rejected. Source URLs must be
strings without embedded null characters. Stream wrappers expire at shutdown;
their returned byte snapshots do not.

## Custom synchronous streams

Construct `new Stream(callbacks, sourceUrl, mode)` with implementations of
`length`, `tell`, `seek`, `read`, `write`, `truncate`, `isReadReady` and
`isWriteReady`. The default URL is empty and the default mode is
`StreamMode.Read + StreamMode.Write`.

Read callbacks receive an independent scratch `Uint8Array` and maximum count.
Fill at most that range and return an integer in `[0, count]`. Do not detach or
resize the scratch buffer. Write callbacks receive a byte snapshot, so edits
cannot affect a parser or the original input. Lengths, positions and removed
byte counts must be nonnegative safe integers; readiness and seek return
booleans.

The optional `peek` defaults to read followed by cursor restoration;
`pushBack` defaults to seek, write and restoration; `popBack` defaults to
truncation. `pushFront` and `popFront` require explicit implementations.
`isEOS` defaults to `tell() >= length()`. `close` runs only on an explicit
`stream.close()`, never during GC or shutdown.

Methods are captured once, so editing the callbacks object does not replace
them. Native API reentry from a stream callback is rejected, including calls
to the same stream or runtime shutdown. Callback exceptions propagate with
their original JS identity. Promise results are rejected synchronously, with
a rejection handler attached. A failed document read does not attach the
document or dispatch its load event. Failed stylesheet parsing can retain
already parsed rules.

Callbacks are retained through GC-visible owner edges. Unreferenced callback
cycles can be collected without keeping the runtime alive.
