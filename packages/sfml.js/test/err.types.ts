import { Writable } from 'node:stream';
import { createWriteStream } from 'node:fs';
import { err, setErrorOutput } from '..';

const stream: Writable = err();
const accepted: boolean = stream.write('diagnostic\n');
stream.write(new Uint8Array([ 65, 10 ]));
setErrorOutput(createWriteStream('sfml.log'));
setErrorOutput(process.stderr);
setErrorOutput(null);
setErrorOutput(undefined);
setErrorOutput();

// @ts-expect-error output takes a Writable, not a path
setErrorOutput('sfml.log');
// @ts-expect-error output takes a Writable, not a callback
setErrorOutput(() => {});
// @ts-expect-error err returns the stream; write supplies the message
err('message');

void accepted;
