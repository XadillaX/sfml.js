'use strict';

const { existsSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { Writable } = require('node:stream');
const { StringDecoder } = require('node:string_decoder');
const sf = require('..');

async function main() {
  const font = new sf.Font();
  const unicodeFont = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf';
  if (!await font.openFromFile(existsSync(unicodeFont) ? unicodeFont
    : join(__dirname, '../test/fixtures/fonts/DejaVuSansMono.ttf'))) {
    throw new Error('Cannot load the demo font');
  }
  const limitArg = process.argv.find(arg => arg.startsWith('--frames='));
  const limit = limitArg ? Number(limitArg.slice(9)) : Infinity;
  if (limitArg && (!Number.isInteger(limit) || limit < 1)) {
    throw new RangeError('Expected positive --frames');
  }
  const window = new sf.RenderWindow(new sf.Vector2u(1050, 758),
    'sfml.js | Async sleep + SFML error stream', {
      style: sf.Style.Titlebar + sf.Style.Close,
    });
  window.setPosition(new sf.Vector2i(70, 60));
  window.setKeyRepeatEnabled(false);
  const clock = new sf.Clock();
  const now = () => Number(clock.getElapsedTime().asMicroseconds()) / 1000;
  const background = new sf.Color(13, 18, 27);
  const panel = new sf.Color(23, 31, 43);
  const accent = new sf.Color(72, 222, 174);
  const muted = new sf.Color(158, 179, 199);
  const texts = [];
  const shapes = [];
  const buttons = [];
  let frames = 0;
  let alive = true;
  let waiting = false;
  let started = 0;
  let firstFrame = 0;
  let sleepTask;
  let diagnosticTask;
  let route = 'panel';
  let received = 0;
  let writes = 0;
  let lastAction = 'Ready. Buttons and keyboard shortcuts are active.';
  let transcript = '';
  const decoder = new StringDecoder('utf8');

  function text(content, x, y, size = 18, color = sf.Color.White) {
    const value = new sf.Text({ font, string: content, characterSize: size });
    value.setPosition(new sf.Vector2f(x, y));
    value.setFillColor(color);
    value.setLineSpacing(1.15);
    texts.push(value);
    return value;
  }
  function update(value, content) {
    if (value.getString() !== content) value.setString(content);
  }
  function box(x, y, width, height, color = panel) {
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

  text('ASYNC SLEEP + ERROR STREAM', 32, 24, 30);
  text('Live animation, real timers, and real SFML diagnostics',
    34, 67, 18, muted);
  box(28, 112, 994, 256);
  box(28, 388, 994, 296);
  text('sleep(Time): Promise<void>', 48, 132, 24, accent);
  text('await sleep(seconds(2))', 48, 180, 20);
  const sleepState = text('', 48, 213, 18);
  box(48, 266, 952, 2, new sf.Color(58, 78, 96));
  const ball = new sf.CircleShape({ radius: 8, pointCount: 24 });
  ball.setFillColor(accent);
  shapes.push(ball);
  box(48, 300, 952, 6, new sf.Color(40, 65, 79));
  const progress = box(48, 300, 0, 6, accent);
  const frameState = text('', 48, 323, 16, muted);
  text('err(): Writable', 48, 408, 24, accent);
  const routeState = text('', 415, 412, 18);
  const byteState = text('', 820, 412, 16, muted);
  const log = text('', 48, 506, 16);
  const actionState = text('', 32, 703, 16, muted);
  text('Captured panel = bytes received by Writable. Esc closes.',
    32, 730, 14, muted);

  const output = new Writable({
    write(bytes, _, done) {
      received += bytes.length;
      transcript += decoder.write(bytes);
      // Bound the display history while retaining enough for the visible rows.
      if (transcript.length > 8000) transcript = transcript.slice(-4000);
      const lines = transcript.trimEnd().split('\n').flatMap(line => {
        const points = Array.from(line);
        return points.length ? Array.from(
          { length: Math.ceil(points.length / 65) },
          (_, i) => points.slice(i * 65, i * 65 + 65).join('')) : [ '' ];
      });
      update(log, lines.slice(-7).join('\n'));
      done();
    },
  });

  function changeRoute(next) {
    sf.setErrorOutput(next === 'panel' ? output
      : next === 'muted' ? null : undefined);
    route = next;
    lastAction = next === 'panel' ? 'SFML logs are redirected to the panel.'
      : next === 'muted' ? 'SFML logs are muted; the captured byte count stays.'
        : 'Original stderr restored; new logs go outside this panel.';
  }

  function writeLog() {
    sf.err().write(`[JS #${++writes}] 中文日志 / err().write / ` +
      `${now().toFixed(0)} ms\n`);
    lastAction = `Wrote message #${writes}; destination: ${route}.`;
  }

  function startSleep() {
    if (waiting) return;
    waiting = true;
    started = now();
    firstFrame = frames;
    sleepTask = (async () => {
      await sf.sleep(sf.seconds(2));
      waiting = false;
      if (!alive) return;
      const elapsed = now() - started;
      const rendered = frames - firstFrame;
      update(sleepState, `Completed in ${elapsed.toFixed(0)} ms; ` +
        `${rendered} frames rendered during the wait.`);
      progress.setSize(new sf.Vector2f(952, 6));
      console.log(`sleep complete: ${rendered} frames during wait`);
    })();
  }

  function nativeDiagnostic() {
    if (diagnosticTask) return;
    lastAction = 'Loading invalid font bytes on a native worker...';
    diagnosticTask = (async () => {
      const invalid = new sf.Font();
      const loaded = await invalid.openFromMemory(new Uint8Array([ 1, 2, 3 ]));
      lastAction = `Native font load returned ${loaded} (expected false).`;
      diagnosticTask = undefined;
    })();
    diagnosticTask.catch(error => { lastAction = String(error); });
  }

  button('S  Wait 2 seconds', 792, 132, 208, startSleep);
  button('W  Write log', 48, 450, 160, writeLog);
  button('N  Native log', 220, 450, 176, nativeDiagnostic);
  button('R  Capture', 408, 450, 176, () => changeRoute('panel'));
  button('M  Mute', 596, 450, 176, () => changeRoute('muted'));
  button('D  Default', 784, 450, 216, () => changeRoute('default'));
  const actions = {
    [sf.Keyboard.Key.S]: startSleep,
    [sf.Keyboard.Key.W]: writeLog,
    [sf.Keyboard.Key.N]: nativeDiagnostic,
    [sf.Keyboard.Key.R]: () => changeRoute('panel'),
    [sf.Keyboard.Key.M]: () => changeRoute('muted'),
    [sf.Keyboard.Key.D]: () => changeRoute('default'),
  };
  function act(action) {
    try { action(); } catch (error) { lastAction = String(error); }
  }

  function snapshot() {
    const capture = new sf.Texture(window.getSize());
    capture.update(window);
    const image = capture.copyToImage();
    const { x, y } = image.getSize();
    const rgb = Buffer.alloc(x * y * 3);
    for (let i = 0; i < x * y; i++) {
      rgb.set(image.pixels.subarray(i * 4, i * 4 + 3), i * 3);
    }
    writeFileSync(process.env.SFML_DEMO_SNAPSHOT, Buffer.concat([
      Buffer.from(`P6\n${x} ${y}\n255\n`), rgb,
    ]));
  }

  changeRoute('panel');
  writeLog();
  startSleep();
  nativeDiagnostic();
  window.requestFocus();
  try {
    while (window.isOpen() && frames < limit) {
      for (let event; (event = window.pollEvent());) {
        const key = event.getIf('KeyPressed');
        if (event.is('Closed') || key?.code === sf.Keyboard.Key.Escape) {
          window.close();
          break;
        }
        if (key && actions[key.code]) act(actions[key.code]);
        const click = event.getIf('MouseButtonPressed');
        if (click?.button === sf.Mouse.Button.Left) {
          for (const button of buttons) {
            const { x, y } = click.position;
            if (x >= button.x && x < button.x + button.width &&
                y >= button.y && y < button.y + 38) act(button.action);
          }
        }
      }
      if (!window.isOpen()) break;
      const elapsed = now();
      ball.setPosition(new sf.Vector2f(
        48 + (elapsed * 0.22) % 936, 259));
      if (waiting) {
        const waited = elapsed - started;
        update(sleepState, `Waiting... ${(waited / 1000).toFixed(1)} / 2.0 s`);
        progress.setSize(new sf.Vector2f(
          Math.min(waited / 2000, 1) * 952, 6));
      }
      update(frameState, `Live frames: ${frames}   /   Animation keeps moving`);
      update(routeState, `Output: ${route}`);
      update(byteState, `${received} bytes captured`);
      update(actionState, lastAction);
      window.clear(background);
      for (const shape of shapes) window.draw(shape);
      for (const value of texts) window.draw(value);
      if (process.env.SFML_DEMO_SNAPSHOT && frames === limit - 1) snapshot();
      window.display();
      frames++;
      await sf.sleep(sf.milliseconds(16));
    }
  } finally {
    alive = false;
    sf.setErrorOutput();
    output.end();
    window.close();
    await Promise.all([ sleepTask, diagnosticTask ]);
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
