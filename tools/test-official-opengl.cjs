'use strict';

// Actual native rendering; only clock and input are scripted.
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { join, resolve } = require('node:path');
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
    assert.equal(result.status, 0, `${exit}: signal ${result.signal}`);
  }
} else {
  run();
}

/** Inspect the GPU framebuffer and state independently of the cube helper. */
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
  const original = {};
  for (const name of [
    'pollEvent', 'display', 'pushGLStates', 'popGLStates',
    'setVerticalSyncEnabled',
  ]) original[name] = sf.RenderWindow.prototype[name];
  const create = sf.Window.prototype.create;
  const load = sf.Texture.prototype.loadFromFile;
  const writes = [];
  const requests = [];
  const backgrounds = [];
  const windows = [];
  const contexts = new Set();
  const resized = new Set();
  let frame = 0;
  let generation = -1;
  let phase = 0;
  let input;
  let background;
  let cube;
  let initial;
  let rotated;
  let mipmapFilter;
  let exitDelivered = false;

  /**
   * Bind an exported GL query using the platform ABI.
   * @param {string} name Entry point.
   * @param {string} result Return type.
   * @param {string[]} args Argument types.
   * @return {Function} Native function.
   */
  function bind(name, result, args) {
    return library.func('__stdcall', name, result, args);
  }

  const gl = {
    pixels: bind('glReadPixels', 'void', [
      'int', 'int', 'int', 'int', 'uint', 'uint', '_Out_ uint8_t *',
    ]),
    integer: bind('glGetIntegerv', 'void', [ 'uint', '_Out_ int *' ]),
    double: bind('glGetDoublev', 'void', [ 'uint', '_Out_ double *' ]),
    filter: bind('glGetTexParameteriv', 'void', [
      'uint', 'uint', '_Out_ int *',
    ]),
    error: bind('glGetError', 'uint', []),
  };

  /**
   * Read actual RGBA pixels from the active window.
   * @param {sf.RenderWindow} window Active render target.
   * @return {Uint8Array} Bottom-up pixels.
   */
  function pixels(window) {
    const { x, y } = window.getSize();
    const data = new Uint8Array(x * y * 4);
    gl.pixels(0, 0, x, y, 0x1908, 0x1401, data);
    assert.equal(gl.error(), 0, 'GL rendering and readback must succeed');
    return data;
  }

  /**
   * Measure changed pixels between two compositing layers.
   * @param {Uint8Array} a Earlier layer.
   * @param {Uint8Array} b Later layer.
   * @param {number} width Framebuffer width.
   * @return {object} Bounds, per-row counts and logo-color pixel counts.
   */
  function difference(a, b, width) {
    assert.equal(a.length, b.length);
    let count = 0;
    let left = width;
    let right = 0;
    let bottom = a.length / 4 / width;
    let top = 0;
    const rows = new Uint32Array(bottom);
    let green = 0;
    let charcoal = 0;
    for (let i = 0; i < a.length; i += 4) {
      if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) +
          Math.abs(a[i + 2] - b[i + 2]) < 12) continue;
      const x = i / 4 % width;
      const y = Math.floor(i / 4 / width);
      count++;
      rows[y]++;
      if (b[i + 1] > b[i] * 1.2 && b[i + 1] > b[i + 2] * 1.2) green++;
      if (b[i] < 190 && Math.abs(b[i] - b[i + 1]) < 4 &&
          Math.abs(b[i] - b[i + 2]) < 4) charcoal++;
      left = Math.min(left, x);
      right = Math.max(right, x);
      bottom = Math.min(bottom, y);
      top = Math.max(top, y);
    }
    return { count, x: (left + right) / 2, y: (bottom + top) / 2,
      left, right, bottom, top, rows, green, charcoal };
  }

  /**
   * Save native pixels without changing any scene drawing.
   * @param {sf.RenderWindow} window Active window.
   * @param {Uint8Array} data Native RGBA pixels.
   * @param {string} name Screenshot name.
   */
  function save(window, data, name) {
    const image = new sf.Image(window.getSize(), data);
    image.flipVertically();
    writes.push(image.saveToFile(join(output, name)).then(ok => {
      assert.ok(ok, `Save ${name}`);
    }));
  }

  /**
   * Create a complete scripted key event.
   * @param {number} code Logical key.
   * @return {sf.Event} Input event.
   */
  function key(code) {
    return new sf.Event({
      kind: 'KeyPressed', code, scancode: sf.Keyboard.Scancode.Unknown,
      alt: false, control: false, shift: false, system: false,
    });
  }

  sf.Window.prototype.create = function(mode, title, options) {
    requests.push(options.settings.sRgbCapable);
    return create.call(this, mode, title, options);
  };
  sf.Texture.prototype.loadFromFile = async function(path, sRgb, ...args) {
    const loaded = await load.call(this, path, sRgb, ...args);
    if (path.endsWith('background.jpg')) backgrounds.push(sRgb);
    return loaded;
  };
  sf.RenderWindow.prototype.setVerticalSyncEnabled = function(enabled) {
    generation++;
    frame = 0;
    phase = 0;
    windows.push(this);
    assert.ok(enabled);
    assert.deepEqual([ this.getSize().x, this.getSize().y ], [ 800, 600 ]);
    assert.ok(this.getSettings().depthBits >= 24);
    return original.setVerticalSyncEnabled.call(this, enabled);
  };
  sf.Clock.prototype.getElapsedTime = () => sf.seconds(frame < 2 ? 0 : 0.7);
  sf.Mouse.getPosition = window => {
    const { x, y } = window.getSize();
    const moved = generation === 0 && frame >= 4 && frame < 6;
    return new sf.Vector2i(x * (moved ? 0.6 : 0.5),
      y * (moved ? 0.4 : 0.5));
  };
  sf.RenderWindow.prototype.pollEvent = function() {
    const event = original.pollEvent.call(this);
    if (event?.is('Resized')) {
      const { size } = event.data;
      resized.add(`${size.x}x${size.y}`);
    }
    if (event) return event;
    const pending = input;
    input = undefined;
    return pending;
  };
  sf.RenderWindow.prototype.pushGLStates = function() {
    assert.ok(this.isOpen(), 'Do not draw after close');
    assert.ok(this.setActive(true));
    if (phase === 1) cube = pixels(this);
    return original.pushGLStates.call(this);
  };
  sf.RenderWindow.prototype.popGLStates = function() {
    original.popGLStates.call(this);
    assert.ok(this.setActive(true));
    if (phase === 0) {
      background = pixels(this);
      contexts.add(sf.Context.getActiveContextId());
    }
    phase++;
  };
  sf.RenderWindow.prototype.display = function() {
    assert.equal(phase, 2, 'Background and text must each restore GL state');
    assert.ok(this.isOpen());
    const final = pixels(this);
    const { x: width, y: height } = this.getSize();
    const box = difference(background, cube, width);
    const text = difference(cube, final, width);
    assert.ok(box.count > width * height * 0.008, 'Textured cube visible');
    assert.ok(box.count < width * height * 0.3, 'Background stays visible');
    assert.ok(box.green > box.count * 0.08 && box.charcoal > box.count * 0.08,
      'Cube texture must contain the green sfml.js mark and dark surround');
    assert.ok(text.count > 500, 'Text visible over the native cube layer');
    assert.ok(text.top < height * 0.27, 'Three lines stay at the bottom');
    for (const y of [ 450, 500, 550 ]) {
      const bottom = Math.floor(height * (1 - (y + 45) / 600));
      const top = Math.ceil(height * (1 - y / 600));
      const count = text.rows.slice(bottom, top).reduce((sum, n) => sum + n, 0);
      assert.ok(count > 120, `Text line at y=${y} must remain visible`);
    }
    const colors = new Set();
    for (let i = 0; i < background.length; i += 400) {
      colors.add(Array.from(background.slice(i, i + 3)).join(','));
    }
    assert.ok(colors.size > 30, 'Background image has real texture detail');

    const viewport = new Int32Array(4);
    const projection = new Float64Array(16);
    const filter = new Int32Array(1);
    gl.integer(0x0ba2, viewport);
    gl.double(0x0ba7, projection);
    gl.filter(0x0de1, 0x2801, filter);
    assert.equal(gl.error(), 0);
    assert.deepEqual(Array.from(viewport), [ 0, 0, width, height ]);
    assert.ok(Math.abs(projection[0] - height / width) < 1e-6);
    assert.ok(Math.abs(projection[5] - 1) < 1e-6);
    assert.ok(Math.abs(projection[10] + 501 / 499) < 1e-6);
    assert.equal(projection[11], -1);

    if (exit === 'escape' && generation === 0) {
      if (frame === 0) {
        initial = cube;
        mipmapFilter = filter[0];
        assert.ok([ 0x2600, 0x2700, 0x2702 ].includes(mipmapFilter),
          `Nearest texture filter: 0x${mipmapFilter.toString(16)}`);
      }
      if (frame === 2) {
        assert.ok(difference(initial, cube, width).count > 1000,
          'Rotation must change real pixels');
        rotated = box;
        save(this, final, 'opengl.png');
      }
      if (frame === 4) {
        assert.ok(box.x > rotated.x + 40, 'Mouse moves cube right');
        assert.ok(box.y > rotated.y + 40, 'Mouse moves cube up');
        save(this, final, 'opengl-mouse.png');
      }
      if (frame === 6) assert.equal(filter[0], 0x2600, 'Mipmap disabled');
      if (frame === 8) {
        assert.equal(filter[0], mipmapFilter, 'Mipmap re-enabled if supported');
      }
      if (frame === 14 || frame === 20) {
        const size = frame === 14 ? [ 1000, 500 ] : [ 400, 600 ];
        assert.deepEqual([ width, height ], size);
        assert.ok(resized.has(`${width}x${height}`), 'Native resize event');
        const view = this.getView();
        assert.deepEqual([ view.getSize().x, view.getSize().y ], [ 800, 600 ]);
        assert.deepEqual([ view.getCenter().x, view.getCenter().y ],
          [ 400, 300 ]);
        save(this, final, `opengl-${width}x${height}.png`);
      }
    }
    if (frame === 2 && generation > 0) {
      save(this, final, `opengl-srgb-${requests[generation]}.png`);
      console.log(`sRGB requested=${requests[generation]}` +
        ` actual=${this.getSettings().sRgbCapable}`);
    }

    original.display.call(this);
    phase = 0;
    frame++;
    if (exit === 'escape' && generation === 0) {
      if (frame === 6 || frame === 8) input = key(sf.Keyboard.Key.Enter);
      if (frame === 10) this.setSize(new sf.Vector2u(1000, 500));
      if (frame === 16) this.setSize(new sf.Vector2u(400, 600));
      if (frame === 22) input = key(sf.Keyboard.Key.Space);
    } else if (frame === 3) {
      if (exit === 'escape' && generation === 1) {
        input = key(sf.Keyboard.Key.Space);
      } else {
        exitDelivered = true;
        if (exit === 'sigint') process.kill(process.pid, 'SIGINT');
        else {
          input = exit === 'escape' ? key(sf.Keyboard.Key.Escape)
            : new sf.Event({ kind: 'Closed' });
        }
      }
    }
    assert.ok(frame <= 22 && generation <= 2, 'Input must terminate loops');
  };

  process.once('beforeExit', async () => {
    assert.ok(exitDelivered, 'Exit input must be reached');
    assert.ok(windows.every(window => !window.isOpen()), 'All windows close');
    const expected = exit === 'escape' ? [ false, true, false ] : [ false ];
    assert.deepEqual(requests, expected, 'sRGB window recreation requests');
    assert.deepEqual(backgrounds, expected, 'Background color-space reloads');
    assert.equal(contexts.size, expected.length, 'Fresh native contexts');
    assert.ok(!contexts.has(0n), 'Actual active native context');
    await Promise.all(writes);
    console.log(`VERIFIED opengl: ${exit}, ${windows.length} native contexts`);
  });
  require('../examples/official/opengl/OpenGL.cjs');
}
