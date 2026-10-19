'use strict';

// Real-window integration test. Only the clock and exit input are scripted.
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { resolve, join } = require('node:path');
const { spawnSync } = require('node:child_process');

if (process.argv[2] !== '--child') {
  assert.ok(process.argv[2], 'Pass an output directory for native screenshots');
  const output = resolve(process.argv[2]);
  mkdirSync(output, { recursive: true });
  for (const exit of [ 'escape', 'closed', 'sigint' ]) {
    const result = spawnSync(process.execPath, [
      __filename, '--child', output, exit,
    ], { stdio: 'inherit', timeout: 20000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0,
      `${exit} must exit cleanly (signal: ${result.signal})`);
  }
} else {
  run();
}

/** Inspect actual GL state and pixels without replacing any drawing calls. */
function run() {
  const sf = require('..');
  const koffi = require('koffi');
  const library = koffi.load({
    darwin: '/System/Library/Frameworks/OpenGL.framework/OpenGL',
    linux: 'libGL.so.1',
    win32: 'opengl32.dll',
  }[process.platform]);
  const output = process.argv[3];
  const exit = process.argv[4];
  const finalFrame = exit === 'escape' ? 20 : 3;
  const poll = sf.Window.prototype.pollEvent;
  const display = sf.Window.prototype.display;
  let frames = 0;
  let window;
  let gl;
  let input;
  let inputDelivered = false;
  let firstPixels;
  let normalBounds;
  const resized = new Set();
  const writes = [];

  /**
   * Bind a GL query without using the example's scene module.
   * @param {string} name GL entry point.
   * @param {string} result C return type.
   * @param {string[]} args C parameter types.
   * @return {Function} Native function.
   */
  function bind(name, result, args) {
    return library.func('__stdcall', name, result, args);
  }

  /**
   * Create a complete public keyboard event, independent of OS focus.
   * @param {number} code Logical key.
   * @return {sf.Event} Scripted event.
   */
  function key(code) {
    return new sf.Event({
      kind: 'KeyPressed', code, scancode: sf.Keyboard.Scancode.Unknown,
      alt: false, control: false, shift: false, system: false,
    });
  }

  sf.Clock.prototype.getElapsedTime = () => sf.seconds(frames < 4 ? 0 : 0.7);
  sf.Window.prototype.pollEvent = function() {
    const event = poll.call(this);
    if (event?.is('Resized')) {
      const { size } = event.data;
      resized.add(`${size.x}x${size.y}`);
    }
    if (event) return event;
    if (input) {
      const scripted = input;
      input = undefined;
      if (frames === finalFrame) inputDelivered = true;
      return scripted;
    }
  };

  /**
   * Measure the cube and its black surround from GPU pixels.
   * @param {number} width Framebuffer width.
   * @param {number} height Framebuffer height.
   * @param {string} filename PNG name.
   * @return {object} Pixels and normalized bounding box.
   */
  function capture(width, height, filename) {
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, 0x1908, 0x1401, pixels);
    assert.equal(gl.getError(), 0, 'Framebuffer read must succeed');
    let count = 0;
    let left = width;
    let right = 0;
    let bottom = height;
    let top = 0;
    const colors = new Set();
    for (let i = 0; i < pixels.length; i += 4) {
      const [ r, g, b ] = pixels.subarray(i, i + 3);
      if (!r && !g && !b) continue;
      count++;
      colors.add(`${r},${g},${b}`);
      const x = (i / 4) % width;
      const y = Math.floor(i / 4 / width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      bottom = Math.min(bottom, y);
      top = Math.max(top, y);
    }
    assert.ok(count > width * height * 0.03, 'Cube must be visible');
    assert.ok(count < width * height * 0.3, 'Black surround must be visible');
    for (const color of colors) {
      assert.ok([
        '0,0,255', '0,255,0', '255,0,0',
        '0,255,255', '255,0,255', '255,255,0',
      ].includes(color), `Unexpected face color ${color}`);
    }
    assert.deepEqual(Array.from(pixels.slice(0, 4)), [ 0, 0, 0, 255 ]);
    if (frames >= 4) assert.ok(colors.size >= 3, 'Three faces must be visible');
    const bounds = [ (right - left + 1) / height, (top - bottom + 1) / height ];
    const image = new sf.Image(new sf.Vector2u(width, height), pixels);
    image.flipVertically();
    writes.push(image.saveToFile(join(output, filename)).then(saved => {
      assert.ok(saved, `Failed to save ${filename}`);
    }));
    return { pixels, bounds };
  }

  sf.Window.prototype.display = function() {
    assert.ok(this.isOpen(), 'Never draw after closing');
    assert.ok(frames < finalFrame, 'Exit event must stop the render loop');
    window = this;
    if (!gl) {
      assert.deepEqual([ this.getSize().x, this.getSize().y ], [ 640, 480 ]);
      assert.ok(this.getSettings().depthBits >= 24);
      gl = {
        readPixels: bind('glReadPixels', 'void', [
          'int', 'int', 'int', 'int', 'uint', 'uint', '_Out_ uint8_t *',
        ]),
        getInteger: bind('glGetIntegerv', 'void', [ 'uint', '_Out_ int *' ]),
        getDouble: bind('glGetDoublev', 'void', [ 'uint', '_Out_ double *' ]),
        getError: bind('glGetError', 'uint', []),
      };
    }
    assert.equal(gl.getError(), 0, 'Scene GL calls must succeed');
    const { x: width, y: height } = this.getSize();
    const viewport = new Int32Array(4);
    const projection = new Float64Array(16);
    gl.getInteger(0x0ba2, viewport);
    gl.getDouble(0x0ba7, projection);
    assert.deepEqual(Array.from(viewport), [ 0, 0, width, height ]);
    assert.ok(Math.abs(projection[0] - height / width) < 1e-6);
    assert.ok(Math.abs(projection[5] - 1) < 1e-6);
    assert.ok(Math.abs(projection[10] + 501 / 499) < 1e-6);
    assert.equal(projection[11], -1);

    if (exit === 'escape') {
      if (frames === 2) {
        firstPixels = capture(width, height, 'window-initial.png').pixels;
      }
      if (frames === 6) {
        const shot = capture(width, height, 'window.png');
        normalBounds = shot.bounds;
        let changed = 0;
        for (let i = 0; i < firstPixels.length; i += 4) {
          if (firstPixels[i] !== shot.pixels[i] ||
              firstPixels[i + 1] !== shot.pixels[i + 1] ||
              firstPixels[i + 2] !== shot.pixels[i + 2]) changed++;
        }
        assert.ok(changed > 1000, 'Cube rotation must change real pixels');
      }
      if (frames === 12 || frames === 18) {
        const size = frames === 12 ? [ 800, 400 ] : [ 400, 640 ];
        assert.deepEqual([ width, height ], size);
        assert.ok(resized.has(`${width}x${height}`), 'Native resize event');
        const shot = capture(width, height, `window-${width}x${height}.png`);
        shot.bounds.forEach((value, i) => {
          assert.ok(Math.abs(value - normalBounds[i]) < 0.015,
            'Resize must preserve cube aspect and vertical field of view');
        });
      }
    }

    display.call(this);
    frames++;
    if (exit === 'escape') {
      if (frames === 3) input = key(sf.Keyboard.Key.A);
      if (frames === 8) this.setSize(new sf.Vector2u(800, 400));
      if (frames === 14) this.setSize(new sf.Vector2u(400, 640));
    }
    if (frames === finalFrame) {
      if (exit === 'sigint') {
        inputDelivered = true;
        process.kill(process.pid, 'SIGINT');
      } else {
        input = exit === 'escape' ? key(sf.Keyboard.Key.Escape)
          : new sf.Event({ kind: 'Closed' });
      }
    }
  };

  process.once('beforeExit', async () => {
    assert.equal(frames, finalFrame);
    assert.ok(inputDelivered, 'Exit stimulus must reach the example');
    assert.equal(window.isOpen(), false, 'Native window must close');
    await Promise.all(writes);
    console.log(`VERIFIED window: ${exit}, ${frames} native frames` +
      (exit === 'escape' ? ', rotation, wide/tall resize and PNGs' : ''));
  });
  require('../examples/official/window/Window.cjs');
}
