'use strict';

const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');
const { label } = require('./bitmap-label.cjs');

const frameArg = process.argv.find(arg => arg.startsWith('--frames='));
const frameLimit = frameArg ? Number(frameArg.slice(9)) : Infinity;
if (frameArg && (!Number.isSafeInteger(frameLimit) || frameLimit <= 0)) {
  throw new RangeError('--frames must be a positive integer');
}
const width = 1080;
const height = 760;
const V = sf.Vector2u;
const F = sf.Vector2f;
const window = new sf.Window(new sf.VideoMode(new V(width, height)),
  'SFML / Window events', { settings: { depthBits: 24, stencilBits: 8 } });
const target = new sf.RenderTexture(new V(width, height));
const white = new sf.Texture(new sf.Image(new V(1, 1), sf.Color.White));
const rectangle = new sf.Sprite(white);
const clock = new sf.Clock();
const colors = {
  background: new sf.Color(12, 18, 28),
  panel: new sf.Color(20, 30, 44),
  grid: new sf.Color(34, 48, 65),
  text: new sf.Color(224, 234, 242),
  muted: new sf.Color(131, 155, 177),
  green: new sf.Color(76, 226, 165),
  blue: new sf.Color(100, 176, 255),
  orange: new sf.Color(255, 192, 108),
};
const cursorTypes = [
  sf.Cursor.Type.Arrow, sf.Cursor.Type.Hand, sf.Cursor.Type.Cross,
  sf.Cursor.Type.Text, sf.Cursor.Type.SizeAll,
];
const cursors = cursorTypes.map(type => ({
  name: sf.Cursor.Type[type], cursor: sf.Cursor.createFromSystem(type),
})).filter(entry => entry.cursor);
const customPixels = new Uint8Array(24 * 24 * 4);
for (let y = 0; y < 24; y++) {
  for (let x = 0; x < 24; x++) {
    if (Math.abs(x - 12) < 2 || Math.abs(y - 12) < 2) {
      customPixels.set([ 76, 226, 165, 255 ], (y * 24 + x) * 4);
    }
  }
}
cursors.push({
  name: 'Custom RGBA',
  cursor: new sf.Cursor(customPixels, new V(24, 24), new V(12, 12)),
});
window.setMouseCursor(cursors[0].cursor);
window.setMinimumSize(new V(810, 570));
window.setVerticalSyncEnabled(false);
window.setKeyRepeatEnabled(false);
window.setJoystickThreshold(0.5);
window.setFramerateLimit(60);
window.setIcon(new V(24, 24), customPixels);
window.requestFocus();

const state = {
  cursor: 0, cursorVisible: true, repeat: false, vsync: false,
  limits: false, alternateSize: false, alternateTitle: false,
  mode: 0, focused: window.hasFocus(), inside: false,
  size: window.getSize(), position: window.getPosition(),
  mouse: new sf.Vector2i(), raw: new sf.Vector2i(), key: 'NONE',
  scancode: 'NONE', modifiers: 'NONE', wheel: 0, text: '',
  unicode: 'NONE', events: 0, clicks: 0, radius: 28,
  aim: new F(260, 310), ball: new F(260, 310), trail: [],
};
const modes = [ 'POLL / IS / GETIF / VISIT', 'HANDLEEVENTS', 'WAITEVENT 1 MS' ];
const rows = [];
const counters = new Map();
let previousLabels = new Map();
let nextLabels = new Map();
let frames = 0;
let restoreTimer;
let snapshot;

function clean(text) {
  return String(text).toUpperCase().replace(/[^A-Z0-9 /:+.-]/g, '?');
}

function text(value, x, y, color = colors.text, scale = 2, max = 80) {
  const content = clean(value).slice(0, max) || ' ';
  const key = `${content}/${x}/${y}/${color.toInteger()}/${scale}`;
  const sprite = previousLabels.get(key) || label(content, x, y, scale, color);
  nextLabels.set(key, sprite);
  target.draw(sprite);
}

function box(x, y, w, h, color) {
  rectangle.setPosition(new F(x, y));
  rectangle.setScale(new F(w, h));
  rectangle.setColor(color);
  target.draw(rectangle);
}

function ring(x, y, radius, color, thickness = 2) {
  const vertices = new sf.VertexArray(sf.PrimitiveType.TriangleStrip, 66);
  for (let i = 0; i <= 32; i++) {
    const angle = i / 32 * Math.PI * 2;
    for (let edge = 0; edge < 2; edge++) {
      const vertex = vertices.getVertex(i * 2 + edge);
      const r = radius + edge * thickness;
      vertex.position = new F(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
      vertex.color = color;
    }
  }
  target.draw(vertices);
}

function record(kind, detail = '') {
  rows.unshift(`${kind} ${detail}`);
  rows.length = Math.min(rows.length, 11);
}

function describe(data) {
  if ('code' in data) return sf.KeyboardKey[data.code];
  if ('unicode' in data) return `U+${data.unicode.toString(16)}`;
  if ('size' in data) return `${data.size.x} X ${data.size.y}`;
  if ('button' in data) {
    return data.kind.startsWith('Mouse') ? sf.MouseButton[data.button]
      : `ID ${data.joystickId} BUTTON ${data.button}`;
  }
  if ('wheel' in data) {
    return `${sf.MouseWheel[data.wheel]} ${data.delta.toFixed(2)}`;
  }
  if ('finger' in data) return `FINGER ${data.finger}`;
  if ('joystickId' in data) return `ID ${data.joystickId}`;
  if (data.kind === 'SensorChanged') return sf.SensorType[data.type];
  return '';
}

function action(code) {
  switch (code) {
    case sf.KeyboardKey.Escape:
      window.close();
      break;
    case sf.KeyboardKey.F1:
      state.cursor = (state.cursor + 1) % cursors.length;
      window.setMouseCursor(cursors[state.cursor].cursor);
      break;
    case sf.KeyboardKey.F2:
      state.cursorVisible = !state.cursorVisible;
      window.setMouseCursorVisible(state.cursorVisible);
      break;
    case sf.KeyboardKey.F3:
      state.repeat = !state.repeat;
      window.setKeyRepeatEnabled(state.repeat);
      break;
    case sf.KeyboardKey.F4:
      state.vsync = !state.vsync;
      window.setVerticalSyncEnabled(state.vsync);
      break;
    case sf.KeyboardKey.F5:
      state.alternateSize = !state.alternateSize;
      window.setSize(state.alternateSize
        ? new V(900, 640) : new V(width, height));
      break;
    case sf.KeyboardKey.F6:
      state.limits = !state.limits;
      window.setMinimumSize(state.limits ? new V(900, 640) : new V(810, 570));
      window.setMaximumSize(state.limits ? new V(1200, 850) : undefined);
      break;
    case sf.KeyboardKey.F7:
      state.alternateTitle = !state.alternateTitle;
      window.setTitle(state.alternateTitle
        ? 'SFML / 标题已更新 / Window events' : 'SFML / Window events');
      break;
    case sf.KeyboardKey.F8:
      if (restoreTimer) break;
      window.setVisible(false);
      restoreTimer = setTimeout(() => {
        restoreTimer = undefined;
        if (!window.isOpen()) return;
        window.setVisible(true);
        window.requestFocus();
        record('ACTION', 'WINDOW RESTORED');
      }, 1000);
      break;
    case sf.KeyboardKey.F9:
      state.mode = (state.mode + 1) % modes.length;
      break;
    case sf.KeyboardKey.F10: {
      const position = window.getPosition();
      window.setPosition(new sf.Vector2i(position.x + 24, position.y + 16));
      break;
    }
    case sf.KeyboardKey.Left: state.aim.x -= 18; break;
    case sf.KeyboardKey.Right: state.aim.x += 18; break;
    case sf.KeyboardKey.Up: state.aim.y -= 18; break;
    case sf.KeyboardKey.Down: state.aim.y += 18; break;
    case sf.KeyboardKey.Backspace:
      state.text = Array.from(state.text).slice(0, -1).join('');
      break;
    default: break;
  }
}

function receive(data) {
  state.events++;
  counters.set(data.kind, (counters.get(data.kind) || 0) + 1);
  if (![ 'MouseMoved', 'MouseMovedRaw' ].includes(data.kind)) {
    record(data.kind, describe(data));
  }
  switch (data.kind) {
    case 'Closed': window.close(); break;
    case 'Resized': state.size = data.size; break;
    case 'FocusGained': state.focused = true; break;
    case 'FocusLost': state.focused = false; break;
    case 'MouseEntered': state.inside = true; break;
    case 'MouseLeft': state.inside = false; break;
    case 'MouseMoved': state.mouse = data.position; break;
    case 'MouseMovedRaw': state.raw = data.delta; break;
    case 'MouseButtonPressed': {
      state.mouse = data.position;
      state.clicks++;
      const x = data.position.x / state.size.x * width;
      const y = data.position.y / state.size.y * height;
      if (x > 24 && x < 516 && y > 132 && y < 450) {
        state.aim = new F(x, y);
        state.trail.push({ x, y, time: clock.getElapsedTime().asSeconds() });
        state.trail = state.trail.slice(-12);
      }
      break;
    }
    case 'MouseWheelScrolled':
      state.wheel += data.delta;
      state.radius = Math.max(8, Math.min(64, state.radius + data.delta * 3));
      break;
    case 'KeyPressed':
      state.key = sf.KeyboardKey[data.code];
      state.scancode = sf.KeyboardScancode[data.scancode];
      state.modifiers = [ 'alt', 'control', 'shift', 'system' ]
        .filter(name => data[name]).join(' ') || 'NONE';
      action(data.code);
      break;
    case 'TextEntered':
      state.unicode = `U+${data.unicode.toString(16)}`;
      if (data.unicode >= 32 && data.unicode !== 127) {
        const character = String.fromCodePoint(data.unicode);
        state.text = Array.from(state.text + character).slice(-34).join('');
        console.log(`TextEntered ${state.unicode}: ${character}`);
      }
      break;
    default: break;
  }
  state.aim.x = Math.max(50, Math.min(490, state.aim.x));
  state.aim.y = Math.max(170, Math.min(420, state.aim.y));
}

function dispatch(event) {
  if (event.is('Closed')) receive(event.getIf('Closed'));
  else if (event.getIf('Resized')) receive(event.getIf('Resized'));
  else event.visit(receive);
}

function events() {
  if (state.mode === 1) {
    window.handleEvents({
      Closed: receive, Resized: receive, KeyPressed: receive,
      MouseButtonPressed: receive, TextEntered: receive,
    }, receive);
  } else {
    if (state.mode === 2) {
      const event = window.waitEvent(sf.milliseconds(1));
      if (event) dispatch(event);
    }
    let event;
    while ((event = window.pollEvent())) dispatch(event);
  }
}

function draw() {
  const time = clock.getElapsedTime().asSeconds();
  state.position = window.getPosition();
  state.ball.x += (state.aim.x - state.ball.x) * 0.16;
  state.ball.y += (state.aim.y - state.ball.y) * 0.16;
  state.trail = state.trail.filter(mark => time - mark.time < 1.2);
  nextLabels = new Map();
  target.setActive();
  target.resetGLStates();
  target.clear(colors.background);
  text('WINDOW / LIVE EVENTS', 24, 24, colors.text, 3);
  text(`${state.events} EVENTS / ${counters.size} KINDS`, 714, 30,
    colors.green, 2, 28);
  text('CLICK - SCROLL - TYPE - RESIZE - SWITCH FOCUS', 24, 64, colors.muted);
  box(24, 96, 492, 354, colors.panel);
  text('POINTER PLAYGROUND', 40, 110, colors.green);
  for (let x = 48; x < 500; x += 32) box(x, 144, 1, 290, colors.grid);
  for (let y = 146; y < 438; y += 32) box(40, y, 460, 1, colors.grid);
  for (const mark of state.trail) {
    const age = time - mark.time;
    ring(mark.x, mark.y, 8 + age * 70,
      new sf.Color(76, 226, 165, Math.max(0, 200 * (1 - age / 1.2))));
  }
  ring(state.ball.x, state.ball.y, state.radius, colors.green, 3);
  box(state.ball.x - 3, state.ball.y - 3, 6, 6, colors.text);
  const mx = state.mouse.x / state.size.x * width;
  const my = state.mouse.y / state.size.y * height;
  if (state.inside && mx > 24 && mx < 516 && my > 140 && my < 450) {
    box(mx - 10, my, 20, 1, colors.blue);
    box(mx, my - 10, 1, 20, colors.blue);
  }
  text('CLICK TO MOVE / ARROWS NUDGE / WHEEL CHANGES RADIUS',
    40, 430, colors.muted, 1);
  box(540, 96, 516, 354, colors.panel);
  text('EVENT STREAM / NEWEST FIRST', 556, 110, colors.blue);
  if (rows.length === 0) {
    text('WAITING FOR YOUR INPUT', 556, 146, colors.muted);
  }
  rows.forEach((row, index) => text(row, 556, 146 + index * 26,
    index === 0 ? colors.text : colors.muted, 2, 40));
  text(`MOUSE ${state.mouse.x} / ${state.mouse.y}   CLICKS ${state.clicks}`,
    24, 470, colors.blue, 2, 43);
  text(`RAW ${state.raw.x} / ${state.raw.y}   WHEEL ${state.wheel.toFixed(2)}`,
    24, 498, colors.muted, 2, 43);
  text(`KEY ${state.key} / SCAN ${state.scancode}`,
    24, 526, colors.text, 2, 43);
  text(`MODIFIERS ${state.modifiers}`, 24, 554, colors.muted, 2, 43);
  text(`TEXT ${state.text || 'TYPE HERE'}`, 24, 582, colors.orange, 2, 43);
  text(`LAST CODEPOINT ${state.unicode}`, 24, 610, colors.muted, 1);
  text(`SIZE ${state.size.x} X ${state.size.y} / LIMITS ${
    state.limits ? 'ON' : 'OFF'}`, 556, 470, colors.text);
  text(`POSITION ${state.position.x} / ${state.position.y}`,
    556, 498, colors.muted);
  text(`FOCUS ${state.focused ? 'YES' : 'NO'} / POINTER ${
    state.inside ? 'INSIDE' : 'OUTSIDE'}`, 556, 526, colors.green);
  text(`CURSOR ${cursors[state.cursor].name} / ${
    state.cursorVisible ? 'VISIBLE' : 'HIDDEN'}`, 556, 554, colors.text, 2, 40);
  text(`REPEAT ${state.repeat ? 'ON' : 'OFF'} / VSYNC ${
    state.vsync ? 'ON' : 'OFF'}`, 556, 582, colors.muted);
  text(`EVENT API ${modes[state.mode]}`, 556, 610, colors.orange, 1);
  box(24, 638, 1032, 1, colors.grid);
  text('F1 CURSOR   F2 CURSOR VISIBLE   F3 KEY REPEAT   F4 VSYNC',
    24, 656, colors.text, 2);
  text('F5 RESIZE   F6 SIZE LIMITS     F7 TITLE        F8 HIDE 1S',
    24, 684, colors.text, 2);
  text('F9 EVENT API   F10 MOVE WINDOW   ESC CLOSE',
    24, 712, colors.text, 2);
  text('MAC: HOLD FN FOR F-KEYS / NON-ASCII TEXT APPEARS AS ? + CODEPOINT',
    24, 742, colors.muted, 1);
  target.display();
  native.drawWindowTexture(window[graphicsNative],
    target.getTexture()[graphicsNative]);
  window.display();
  previousLabels = nextLabels;
}

function finish() {
  if (restoreTimer) clearTimeout(restoreTimer);
  window.close();
  console.log(`Closed: ${frames} frames, ${state.events} real events.`);
  console.log('Event counts:', Object.fromEntries(counters));
}

function frame() {
  try {
    events();
    if (!window.isOpen()) return finish();
    draw();
    frames++;
    if (frames === 2 && process.env.SFML_DEMO_SNAPSHOT) {
      snapshot = target.getTexture().copyToImage()
        .saveToFile(process.env.SFML_DEMO_SNAPSHOT);
    }
    if (frames >= frameLimit) {
      return Promise.resolve(snapshot).then(finish, error => {
        console.error(error);
        process.exitCode = 1;
        finish();
      });
    }
    setImmediate(frame);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
    finish();
  }
}

console.log('Window demo: real events via public Window / Event APIs.');
console.log('Click, scroll, type, resize or switch focus. F1-F10: controls.');
console.log('Context:', window.getSettings());
console.log('Native handle:', window.getNativeHandle());
frame();
