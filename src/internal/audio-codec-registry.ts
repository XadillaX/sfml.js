import type {
  SoundFileReader, SoundFileReaderConstructor,
} from '../audio/sound-file-reader';
import type {
  SoundFileWriter, SoundFileWriterConstructor,
} from '../audio/sound-file-writer';
import { FileInputStream } from '../system/file-input-stream';
import { MemoryInputStream, type InputStream } from '../system/input-stream';

export const audioReaders = new Set<SoundFileReaderConstructor>();
export const audioWriters = new Set<SoundFileWriterConstructor>();

export async function findAudioReader(
  stream: InputStream,
): Promise<SoundFileReader | undefined> {
  for (const Reader of [ ...audioReaders ].reverse()) {
    if (await stream.seek(0n) !== 0n) return undefined;
    const matches = await Reader.check(stream);
    if (typeof matches !== 'boolean') {
      throw new TypeError('Reader.check must return a boolean');
    }
    if (matches) {
      if (await stream.seek(0n) !== 0n) return undefined;
      return new Reader();
    }
  }
  await stream.seek(0n);
  return undefined;
}

export async function findAudioWriter(
  filename: string,
): Promise<SoundFileWriter | undefined> {
  for (const Writer of [ ...audioWriters ].reverse()) {
    const matches = await Writer.check(filename);
    if (typeof matches !== 'boolean') {
      throw new TypeError('Writer.check must return a boolean');
    }
    if (matches) return new Writer();
  }
  return undefined;
}

export async function findAudioReaderInput(
  input: string | Uint8Array | InputStream,
): Promise<{
    reader: SoundFileReader; stream: InputStream; owned?: FileInputStream;
  } | undefined> {
  if (!audioReaders.size) return undefined;
  let owned: FileInputStream | undefined;
  let stream: InputStream;
  if (typeof input === 'string') {
    owned = new FileInputStream();
    if (!await owned.open(input)) return undefined;
    stream = owned;
  } else {
    stream = input instanceof Uint8Array ? new MemoryInputStream(input) : input;
  }
  try {
    const reader = await findAudioReader(stream);
    if (reader) return { reader, stream, owned };
  } catch (error) {
    await owned?.close();
    throw error;
  }
  await owned?.close();
  return undefined;
}
