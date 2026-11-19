import {
  Stream, StreamMemory, StreamFile, StreamMode, SeekOrigin,
  type StreamCallbacks, type Context, StyleSheetContainer,
} from '../../src';

const callbacks: StreamCallbacks = {
  length: () => 0,
  tell: () => 0,
  seek: () => true,
  read: () => 0,
  write: (_input, count) => count,
  truncate: () => 0,
  isReadReady: () => false,
  isWriteReady: () => true,
};
const custom = new Stream(callbacks, 'custom.rml', StreamMode.Read);
const memory = new StreamMemory(new Uint8Array(0));
const capacity = new StreamMemory(32);
const file = new StreamFile();
const opened: boolean = file.open('document.rml');
const bytes: Uint8Array = custom.read(8);
const peek: Uint8Array = custom.peek(8);
const readCount: number = custom.read(bytes, 3);
const copyCount: number = custom.read(capacity, 3);
const peekCount: number = memory.peek(bytes, 3);
const wrote: number = capacity.write(custom, 4);
const textCount: number = capacity.write('text\0full');
const cCount: number = capacity.writeCString('text\0stop');
const seeked: boolean = memory.seek(0, SeekOrigin.End);
const text: string = memory.readString(4, 'prefix');
const length: number = memory.length();
const position: number = memory.tell();
const eof: boolean = memory.isEOS();
const readable: boolean = memory.isReadReady();
const writable: boolean = memory.isWriteReady();
const mode: number = memory.getStreamMode();
const url: string = memory.getSourceURL();
const snapshot: Uint8Array = memory.rawStream();
capacity.pushFront(bytes);
capacity.pushBack('back');
capacity.popFront(3);
capacity.popBack(3);
capacity.truncate(0);
capacity.erase(0, 0);
capacity.setSourceURL('source.rml');
file.close();
new StyleSheetContainer().loadStyleSheetContainer(custom, '', 5);
declare const context: Context;
context.loadDocument(custom);
context.loadDocument(file);
context.loadDocument(memory);

// @ts-expect-error Callback reads must return counts synchronously.
new Stream({ ...callbacks, read: async () => 0 });
// @ts-expect-error Only unsigned byte views are valid stream input.
new StreamMemory(new Uint16Array(0));
// @ts-expect-error Byte count overload returns bytes, not a count.
const invalidCount: number = memory.read(4);
// @ts-expect-error File streams do not expose reallocating memory storage.
file.rawStream();
// @ts-expect-error Missing required callbacks must be caught by consumers.
new Stream({});

void [
  opened, bytes, peek, readCount, copyCount, peekCount, wrote, textCount,
  cCount, seeked, text, length, position, eof, readable, writable, mode, url,
  snapshot, invalidCount,
];
