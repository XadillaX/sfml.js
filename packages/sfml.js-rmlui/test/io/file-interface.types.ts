import {
  FileCallbacks, FileHandle, FileInterface, getFileInterface,
  SeekOrigin, setFileInterface, StreamMemory,
} from '../../src';

const callbacks: FileCallbacks = {
  open: () => new Uint8Array([ 1, 2, 3 ]),
  read: (output, size, file) => {
    const token: FileHandle = file;
    void token;
    output.fill(1);
    return size;
  },
  length: () => 3,
  seek: (_file, _offset, origin) => origin === SeekOrigin.Set,
};
const files = new FileInterface(callbacks);
setFileInterface(files);
const selected: FileInterface | null = getFileInterface();
const file: FileHandle | null = files.open('path');
const bytes: Uint8Array | null = files.loadFile('path');
void selected;
void bytes;
if (file) {
  const count: number = files.read(new Uint8Array(3), 3, file);
  const moved: boolean = files.seek(file, 0, SeekOrigin.Set);
  const position: number = files.tell(file);
  const length: number = files.length(file);
  void [ count, moved, position, length ];
  files.close(file);
}

new FileInterface({ open: () => new StreamMemory() });
// @ts-expect-error Arbitrary objects are not native providers.
setFileInterface({});
// @ts-expect-error File tokens have no public constructor.
new FileHandle();
// @ts-expect-error Native files cannot be pointer addresses.
files.tell(123);
// @ts-expect-error File callbacks must be synchronous.
new FileInterface({ open: async () => new Uint8Array() });
// @ts-expect-error LoadFile produces bytes, never text.
new FileInterface({ open: () => null, loadFile: () => 'text' });
// @ts-expect-error Length requires a native file token from this provider.
files.length(new StreamMemory());
