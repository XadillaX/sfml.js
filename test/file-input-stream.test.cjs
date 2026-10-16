'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const { mkdtemp, writeFile, appendFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { setImmediate: nextTurn } = require('node:timers/promises');
const sf = require('..');

async function fixture(t, data = Buffer.from([ 1, 2, 3, 4, 5 ])) {
  const directory = await mkdtemp(join(tmpdir(), 'sfml-file-stream-'));
  const filename = join(directory, '文件.bin');
  const stream = new sf.FileInputStream();
  t.after(async () => {
    await stream.close();
    await rm(directory, { recursive: true, force: true });
  });
  await writeFile(filename, data);
  return { directory, filename, stream };
}

test('FileInputStream reads subarrays, seeks past EOF, and reports live size',
  async t => {
    const { filename, stream } = await fixture(t);
    assert.ok(stream instanceof sf.InputStream);
    assert.equal(await stream.tell(), undefined);
    assert.equal(await stream.getSize(), undefined);
    assert.equal(await stream.seek(0n), undefined);
    assert.equal(await stream.read(new Uint8Array(1)), undefined);
    assert.equal(await stream.open(filename), true);
    assert.equal(await stream.getSize(), 5n);
    assert.equal(await stream.tell(), 0n);
    const bytes = new Uint8Array(6).fill(99);
    assert.equal(await stream.read(bytes.subarray(1, 4)), 3n);
    assert.deepEqual([ ...bytes ], [ 99, 1, 2, 3, 99, 99 ]);
    assert.equal(await stream.tell(), 3n);
    assert.equal(await stream.read(bytes), 2n);
    assert.equal(await stream.read(bytes), 0n);
    assert.equal(await stream.seek(100n), 100n);
    assert.equal(await stream.read(bytes), 0n);
    assert.equal(await stream.tell(), 100n);
    assert.equal(await stream.seek(1n), 1n);
    assert.equal(await stream.read(new Uint8Array()), 0n);
    assert.equal(await stream.tell(), 1n);
    await writeFile(filename, Buffer.from([ 7, 8 ]));
    assert.equal(await stream.getSize(), 2n);
    assert.equal(await stream.read(bytes), 1n);
    assert.equal(bytes[0], 8);
    await stream.close();
    await stream.close();
    assert.equal(await stream.tell(), undefined);
  });

test('FileInputStream serializes open, reads, seek, close and reopen',
  async t => {
    const { directory, filename, stream } = await fixture(t);
    const other = join(directory, 'other.bin');
    await writeFile(other, Buffer.from([ 8, 9 ]));
    const a = new Uint8Array(2);
    const b = new Uint8Array(2);
    const c = new Uint8Array(1);
    assert.deepEqual(await Promise.all([
      stream.open(filename),
      stream.read(a), stream.read(b), stream.tell(),
      stream.seek(1n), stream.read(c),
      stream.close(), stream.read(c),
      stream.open(other), stream.tell(), stream.read(c),
    ]), [ true, 2n, 2n, 4n, 1n, 1n, undefined, undefined, true, 0n, 1n ]);
    assert.deepEqual([ ...a ], [ 1, 2 ]);
    assert.deepEqual([ ...b ], [ 3, 4 ]);
    assert.deepEqual([ ...c ], [ 8 ]);
  });

test('failed opens close the previous file and do not poison subsequent calls',
  async t => {
    const { directory, filename, stream } = await fixture(t);
    assert.equal(await stream.open(filename), true);
    assert.equal(await stream.open(join(directory, 'missing')), false);
    assert.equal(await stream.tell(), undefined);
    assert.equal(await stream.getSize(), undefined);
    assert.equal(await stream.read(new Uint8Array(1)), undefined);
    assert.equal(await stream.open(filename), true);
    assert.throws(() => stream.open('bad\0path'), TypeError);
    assert.throws(() => stream.read([]), TypeError);
    assert.throws(() => stream.seek(-1n), RangeError);
    assert.throws(() => stream.seek(1), RangeError);
    assert.throws(() => stream.seek(2n ** 53n), RangeError);
    assert.equal(await stream.seek(0n), 0n);
    assert.equal(await stream.read(new Uint8Array(1)), 1n);
  });

test('FileInputStream reads large buffers and seeks across their boundaries',
  async t => {
    const source = Buffer.alloc(3 * 65536 + 193);
    for (let i = 0; i < source.length; i++) {
      source[i] = (i * 31 + Math.floor(i / 256) * 17 +
        Math.floor(i / 65536) * 7) % 256;
    }
    const { filename, stream } = await fixture(t, source);
    assert.equal(await stream.open(filename), true);
    for (const [ position, length ] of [
      [ 0, 1 ], [ 10, 127 ], [ 2, 128 ], [ 65500, 129 ],
      [ 65535, 65535 ], [ 65536, 65536 ], [ 1, 65537 ],
      [ 0, source.length + 10 ], [ source.length + 10, 2 ], [ 0, 32 ],
    ]) {
      const destination = new Uint8Array(length + 2).fill(99);
      const expected = source.subarray(position, position + length);
      assert.deepEqual(await Promise.all([
        stream.seek(BigInt(position)),
        stream.read(destination.subarray(1, length + 1)),
        stream.tell(),
      ]), [
        BigInt(position), BigInt(expected.length),
        BigInt(position + expected.length),
      ]);
      assert.deepEqual(
        Buffer.from(destination.subarray(1, expected.length + 1)), expected);
      assert.ok(destination.subarray(expected.length + 1)
        .every(value => value === 99));
      assert.equal(destination[0], 99);
    }
  });

test('FileInputStream advances by the actual byte count after a short read',
  async t => {
    const { filename, stream } = await fixture(t);
    assert.equal(await stream.open(filename), true);
    const originalRead = fs.read;
    const read = t.mock.method(fs, 'read',
      (fd, buffer, offset, length, position, callback) =>
        originalRead(fd, buffer, offset, Math.min(length, 2),
          position, callback));
    const bytes = new Uint8Array(5).fill(99);
    assert.equal(await stream.read(bytes), 2n);
    assert.equal(await stream.tell(), 2n);
    assert.deepEqual([ ...bytes ], [ 1, 2, 99, 99, 99 ]);
    read.mock.restore();
    assert.equal(await stream.read(bytes), 3n);
    assert.equal(await stream.tell(), 5n);
    assert.deepEqual([ ...bytes ], [ 3, 4, 5, 99, 99 ]);
    assert.equal(await stream.read(bytes), 0n);
  });

test('FileInputStream can read appended data after repeated EOF and same seek',
  async t => {
    const { filename, stream } = await fixture(t, Buffer.alloc(0));
    assert.equal(await stream.open(filename), true);
    const bytes = new Uint8Array(8);
    for (let i = 0; i < 3; i++) {
      assert.equal(await stream.seek(0n), 0n);
      assert.equal(await stream.read(bytes), 0n);
    }
    await appendFile(filename, Buffer.from([ 1, 2, 3 ]));
    assert.equal(await stream.read(bytes), 3n);
    assert.deepEqual([ ...bytes.subarray(0, 3) ], [ 1, 2, 3 ]);
    assert.equal(await stream.read(bytes), 0n);
    await appendFile(filename, Buffer.from([ 4, 5 ]));
    assert.equal(await stream.seek(3n), 3n);
    assert.equal(await stream.read(bytes), 2n);
    assert.deepEqual([ ...bytes.subarray(0, 2) ], [ 4, 5 ]);
    assert.equal(await stream.getSize(), 5n);
    assert.equal(await stream.tell(), 5n);
    assert.equal(await stream.seek(0n), 0n);
    assert.equal(await stream.read(bytes), 5n);
    assert.deepEqual([ ...bytes.subarray(0, 5) ], [ 1, 2, 3, 4, 5 ]);
  });

test('FileInputStream waits for in-flight I/O before seeking and closing',
  async t => {
    const { filename, stream } = await fixture(t);
    assert.equal(await stream.open(filename), true);
    let release;
    let started;
    let didClose = false;
    const reading = new Promise(resolve => { started = resolve; });
    const originalRead = fs.read;
    t.mock.method(fs, 'read', (...args) => {
      const callback = args.pop();
      return originalRead(...args, (...result) => {
        release = () => callback(...result);
        started();
      });
    });
    const bytes = new Uint8Array(3);
    const result = stream.read(bytes);
    await reading;
    const seek = stream.seek(1n);
    const close = stream.close().then(() => { didClose = true; });
    try {
      await nextTurn();
      assert.equal(didClose, false);
    } finally {
      release();
    }
    assert.deepEqual(await Promise.all([ result, seek, close ]),
      [ 3n, 1n, undefined ]);
    assert.deepEqual([ ...bytes ], [ 1, 2, 3 ]);
    assert.equal(didClose, true);
    assert.equal(await stream.tell(), undefined);
  });

test('FileInputStream recovers from repeated read errors and can reopen',
  async t => {
    const { filename, stream } = await fixture(t);
    assert.equal(await stream.open(filename), true);
    const read = t.mock.method(fs, 'read', (...args) => {
      const callback = args[args.length - 1];
      process.nextTick(callback, Object.assign(new Error('read failed'),
        { code: 'EIO' }));
    });
    const bytes = new Uint8Array(3);
    for (let i = 0; i < 20; i++) {
      assert.equal(await stream.read(bytes), undefined);
      assert.equal(await stream.tell(), 0n);
    }
    read.mock.restore();
    assert.equal(await stream.read(bytes), 3n);
    assert.deepEqual([ ...bytes ], [ 1, 2, 3 ]);
    await stream.close();
    assert.equal(await stream.open(filename), true);
    assert.equal(await stream.read(bytes), 3n);
  });

test('FileInputStream loads Image and Texture with identical decoded pixels',
  async t => {
    const size = new sf.Vector2u(3, 2);
    const source = new sf.Image(size, sf.Color.Red);
    source.setPixel(new sf.Vector2u(1, 0), sf.Color.Blue);
    const { filename, stream } = await fixture(t,
      await source.saveToMemory('png'));
    assert.equal(await stream.open(filename), true);
    const image = new sf.Image();
    assert.equal(await image.loadFromStream(stream), true);
    assert.deepEqual(image.pixels, source.pixels);
    const texture = new sf.Texture();
    assert.equal(await texture.loadFromStream(stream), true);
    assert.deepEqual(texture.copyToImage().pixels, source.pixels);
    assert.equal(await stream.getSize(), BigInt(
      (await source.saveToMemory('png')).length));
  });

test('FileInputStream loads single and paired shader stages and renders',
  async t => {
    const fragment = 'void main(){gl_FragColor=vec4(0,1,0,1);}';
    const { directory, filename, stream } = await fixture(t, fragment);
    const vertexFile = join(directory, 'source.vert');
    await writeFile(vertexFile, 'void main(){' +
      'gl_Position=gl_ModelViewProjectionMatrix*gl_Vertex;}');
    const vertex = new sf.FileInputStream();
    try {
      assert.equal(await stream.open(filename), true);
      assert.equal(await vertex.open(vertexFile), true);
      const shader = new sf.Shader();
      assert.equal(await shader.loadFromStream(stream, sf.Shader.Type.Fragment),
        true);
      assert.equal(await shader.loadFromStream(vertex, stream), true);
      const output = new sf.RenderTexture(new sf.Vector2u(1, 1));
      output.clear();
      output.draw([ new sf.Vertex(new sf.Vector2f(0.5, 0.5)) ],
        sf.PrimitiveType.Points, shader);
      output.display();
      assert.deepEqual([ ...output.getTexture().copyToImage().pixels ],
        [ 0, 255, 0, 255 ]);
    } finally {
      await vertex.close();
    }
  });
