import type { InputStream } from '../system/input-stream';
import { SFMLError } from '../system/error';
import type { NativeStreamDispatch } from './native';

/** Keep the stream alive until native decoding and every pending read finish. */
export function streamDispatch(
  stream: InputStream, onError: (error: unknown) => void,
): NativeStreamDispatch {
  if (!stream || [ 'read', 'seek', 'tell', 'getSize' ].some(
    key => typeof stream[key as keyof InputStream] !== 'function',
  )) throw new TypeError('Expected an InputStream');
  return (operation, data, position, complete) => {
    const execute = async () => {
      switch (operation) {
        case 0: return await stream.read(data!);
        case 1: return await stream.seek(position);
        case 2: return await stream.tell();
        case 3: return await stream.getSize();
        default: throw new SFMLError('Unknown stream operation');
      }
    };
    void execute().then(
      result => complete(null, result),
      error => {
        onError(error);
        complete('InputStream callback failed');
      },
    );
  };
}
