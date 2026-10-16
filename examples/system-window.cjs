'use strict';

const { existsSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { setTimeout: nextFrame } = require('node:timers/promises');
const sf = require('..');

async function main() {
  const font = new sf.Font();
  const unicodeFont = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf';
  const fontPath = existsSync(unicodeFont) ? unicodeFont
    : join(__dirname, '../test/fixtures/fonts/DejaVuSansMono.ttf');
  if (!await font.openFromFile(fontPath)) throw new Error('Cannot load font');
  const version = sf.version();
  const sample = `sfml.js | SFML ${version.string} | Clipboard`;
  const window = new sf.RenderWindow(new sf.Vector2u(1000, 740),
    'sfml.js | Version / Clipboard / Context / Touch', {
      style: sf.Style.Titlebar + sf.Style.Close,
    });
  window.setKeyRepeatEnabled(false);
  window.setPosition(new sf.Vector2i(80, 70));
  const contexts = [ new sf.Context(), new sf.Context() ];
  const background = new sf.Color(13, 18, 27);
  const panelColor = new sf.Color(23, 31, 43);
  const accent = new sf.Color(72, 222, 174);
  const muted = new sf.Color(158, 179, 199);
  const texts = [];
  const shapes = [];
  const buttons = [];
  let selected = 0;
  let switches = 0;
  let touchEvent = 'Waiting for touch events';
  let lastError = '';

  function text(content, x, y, size = 18, color = sf.Color.White) {
    const value = new sf.Text({ font, string: content, characterSize: size });
    value.setPosition(new sf.Vector2f(x, y));
    value.setFillColor(color);
    value.setLineSpacing(1.2);
    texts.push(value);
    return value;
  }

  function update(value, content) {
    if (value.getString() !== content) value.setString(content);
  }

  function box(x, y, width, height, color = panelColor) {
    const value = new sf.RectangleShape(new sf.Vector2f(width, height));
    value.setPosition(new sf.Vector2f(x, y));
    value.setFillColor(color);
    shapes.push(value);
    return value;
  }

  function button(label, x, y, width, action) {
    box(x, y, width, 38, new sf.Color(40, 65, 79));
    text(label, x + 12, y + 8, 16, accent);
    buttons.push({ x, y, width, action });
  }

  function guarded(action) {
    try { action(); lastError = ''; } catch (error) {
      lastError = `${error.name}: ${error.message}`.slice(0, 110);
    }
  }

  text('SYSTEM + WINDOW', 32, 24, 30);
  text('Four live SFML APIs   /   click buttons or use C, V, A',
    34, 67, 18, muted);
  box(28, 110, 458, 245);
  box(506, 110, 466, 245);
  box(28, 375, 458, 295);
  box(506, 375, 466, 295);

  text('Version', 48, 128, 24, accent);
  text(`SFML ${version.string}`, 48, 169, 32);
  text(`major ${version.major}   minor ${version.minor}` +
    `   patch ${version.patch}`, 48, 221);
  text(`isRelease: ${version.isRelease}`, 48, 252);
  text(`Same cached object: ${sf.version() === version}\n` +
    `Readonly: ${Object.isFrozen(version)}`, 48, 285, 16, muted);

  text('Clipboard', 526, 128, 24, accent);
  const clipboardText = text('Press V to read the system clipboard.',
    526, 178, 18);
  const clipboardStatus = text('C copies the demo text; V reads any text.',
    526, 265, 15, muted);

  function readClipboard(copied = false) {
    const value = sf.Clipboard.getString();
    const characters = Array.from(value.replace(/\r/g, ''));
    const preview = characters.slice(0, 120).join('')
      .split('\n')
      .flatMap(line => {
        const points = Array.from(line);
        return points.length ? Array.from(
          { length: Math.ceil(points.length / 22) },
          (_, i) => points.slice(i * 22, i * 22 + 22).join('')) : [ '' ];
      })
      .slice(0, 3)
      .join('\n');
    update(clipboardText, preview || '(empty clipboard)');
    update(clipboardStatus, copied
      ? `Copy + readback: ${value === sample ? 'MATCH' : 'MISMATCH'}`
      : `Read ${Array.from(value).length} Unicode code points`);
  }

  function copyClipboard() {
    sf.Clipboard.setString(sample);
    readClipboard(true);
  }

  button('C  Copy sample', 526, 304, 194, copyClipboard);
  button('V  Read clipboard', 734, 304, 216, () => readClipboard());

  text('Context', 48, 394, 24, accent);
  const contextText = text('', 48, 436, 17);
  const windowContextText = text('', 48, 585, 15, muted);

  function activateContext() {
    const context = contexts[selected];
    if (!context.setActive(true)) throw new Error('Context activation failed');
    let restored = false;
    try {
      const settings = context.getSettings();
      const id = sf.Context.getActiveContextId();
      const identity = sf.Context.getActiveContext() === context;
      const pointer = sf.Context.getFunction('glGetString');
      const address = pointer ? '0x' + pointer.toString(16) : 'unavailable';
      update(contextText,
        `Activated ${selected ? 'B' : 'A'}   /   ID ${id}\n` +
        `Identity matches: ${identity}\n` +
        `OpenGL ${settings.majorVersion}.${settings.minorVersion}` +
        `   depth ${settings.depthBits} / stencil ${settings.stencilBits}\n` +
        `glGetString: ${address}\n` +
        `Activation checks: ${++switches}`);
      if (!identity || id === 0n) {
        throw new Error('Context identity mismatch');
      }
    } finally {
      restored = window.setActive(true);
    }
    if (!restored) throw new Error('Cannot activate window');
    update(windowContextText,
      `Rendering on window context ${sf.Context.getActiveContextId()}`);
  }

  function switchContext() {
    selected = 1 - selected;
    activateContext();
  }
  button('A  Switch A / B', 48, 612, 416, switchContext);
  activateContext();

  text('Touch', 526, 394, 24, accent);
  const touchText = text('', 526, 436, 18);
  const touchEventText = text(touchEvent, 526, 560, 15, muted);
  text(process.platform === 'darwin'
    ? 'macOS: trackpad gestures are not SFML touches.'
    : 'Values below come from the native Touch API.',
  526, 601, 15, muted);
  text('Real-time Touch is deprecated in SFML 3.1.',
    526, 629, 15, muted);
  const fingers = Array.from({ length: 4 }, (_, i) => {
    text(`${i}`, 840 + i * 27, 398, 15, muted);
    return box(840 + i * 27, 422, 17, 4);
  });
  const status = text('', 32, 693, 16, muted);
  const clock = new sf.Clock();
  const limitArg = process.argv.find(arg => arg.startsWith('--frames='));
  const limit = limitArg ? Number(limitArg.slice(9)) : Infinity;
  if (limitArg && (!Number.isInteger(limit) || limit < 1)) {
    window.close();
    throw new RangeError('Expected positive --frames');
  }
  const actions = {
    [sf.Keyboard.Key.C]: copyClipboard,
    [sf.Keyboard.Key.V]: () => readClipboard(),
    [sf.Keyboard.Key.A]: switchContext,
  };
  window.requestFocus();
  try {
    for (let frame = 0; frame < limit && window.isOpen(); frame++) {
      for (let event; (event = window.pollEvent());) {
        const key = event.getIf('KeyPressed');
        if (event.is('Closed') || key?.code === sf.Keyboard.Key.Escape) {
          window.close();
          break;
        }
        if (key && actions[key.code]) guarded(actions[key.code]);
        const click = event.getIf('MouseButtonPressed');
        if (click?.button === sf.Mouse.Button.Left) {
          for (const button of buttons) {
            const { x, y } = click.position;
            if (x >= button.x && x < button.x + button.width &&
                y >= button.y && y < button.y + 38) guarded(button.action);
          }
        }
        for (const kind of [ 'TouchBegan', 'TouchMoved', 'TouchEnded' ]) {
          const touch = event.getIf(kind);
          if (touch) {
            touchEvent = `${kind} #${touch.finger}: ` +
              `${touch.position.x}, ${touch.position.y}`;
          }
        }
      }
      if (!window.isOpen()) break;
      const down = fingers.map((marker, index) => {
        const value = sf.Touch.isDown(index);
        marker.setFillColor(value ? accent : muted);
        return value;
      });
      const global = sf.Touch.getPosition(0);
      const local = sf.Touch.getPosition(0, window);
      update(touchText,
        `Finger 0 down: ${down[0]}\n` +
        `Global:  ${global.x}, ${global.y}\n` +
        `Window:  ${local.x}, ${local.y}\n` +
        `Active fingers [0..3]: ${down.filter(Boolean).length}`);
      update(touchEventText, touchEvent);
      update(status, lastError || `LIVE  ${clock.getElapsedTime()
        .asSeconds().toFixed(1)} s    /    Esc closes this window`);
      window.clear(background);
      for (const shape of shapes) window.draw(shape);
      for (const value of texts) window.draw(value);
      if (frame === 1 && process.env.SFML_DEMO_SNAPSHOT) {
        const capture = new sf.Texture(window.getSize());
        capture.update(window);
        const image = capture.copyToImage();
        const size = image.getSize();
        const rgb = Buffer.alloc(size.x * size.y * 3);
        for (let i = 0; i < size.x * size.y; i++) {
          rgb.set(image.pixels.subarray(i * 4, i * 4 + 3), i * 3);
        }
        writeFileSync(process.env.SFML_DEMO_SNAPSHOT, Buffer.concat([
          Buffer.from(`P6\n${size.x} ${size.y}\n255\n`), rgb,
        ]));
      }
      window.display();
      if (frame === 0) {
        console.log('Version / Clipboard / Context / Touch ready');
      }
      await nextFrame(16);
    }
  } finally { window.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
