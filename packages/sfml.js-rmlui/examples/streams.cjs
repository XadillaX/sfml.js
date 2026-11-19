'use strict';

const path = require('node:path');
const { parseArgs } = require('node:util');
const sfml = require('sfml.js');
const rmlui = require('../dist');

const width = 720;
const height = 420;

function callbackSource(text, url) {
  const data = Buffer.from(text);
  let position = 0;
  return new rmlui.Stream({
    length: () => data.length,
    tell: () => position,
    seek(offset, origin) {
      const base = origin === rmlui.SeekOrigin.Set ? 0 :
        (origin === rmlui.SeekOrigin.Current ? position : data.length);
      const target = base + offset;
      if (target < 0 || target > data.length) {
        return false;
      }
      position = target;
      return true;
    },
    read(output, count) {
      const size = Math.min(count, data.length - position);
      output.set(data.subarray(position, position + size));
      position += size;
      return size;
    },
    write() {
      throw new Error('This callback source is read-only');
    },
    truncate() {
      throw new Error('This callback source is read-only');
    },
    isReadReady: () => position < data.length,
    isWriteReady: () => false,
  }, url, rmlui.StreamMode.Read);
}

function loadPanel(context) {
  const origin = path.join(__dirname, 'streams/panel.rml');
  const file = new rmlui.StreamFile();
  if (!file.open(origin)) {
    throw new Error('Failed to open the stream document');
  }
  const document = context.loadDocument(file);
  console.log(`File stream: ${file.tell()} / ${file.length()} bytes`);
  file.close();

  const memory = new rmlui.StreamMemory(Buffer.from(
    '<rml><head/><body id="memory-input"/></rml>'));
  memory.setSourceURL(origin);
  const hidden = context.loadDocument(memory);
  console.log(`Memory stream document: ${hidden.id}`);
  hidden.close();

  const rules = new rmlui.StyleSheetContainer();
  const base = new rmlui.StreamFile();
  if (!base.open(path.join(__dirname, 'streams/panel.rcss'))) {
    throw new Error('Failed to open the stream stylesheet');
  }
  if (!rules.loadStyleSheetContainer(base)) {
    throw new Error('Failed to parse the stream stylesheet');
  }
  base.close();

  const writable = new rmlui.StreamMemory();
  writable.write('#memory { border-left-color: #6ebcfa; color: #9bd0fb; }');
  writable.seek(0, rmlui.SeekOrigin.Set);
  writable.setSourceURL(origin);
  const custom = callbackSource(
    '#custom { border-left-color: #74d3ad; color: #99dfc3; }', origin);
  if (!rules.loadStyleSheetContainer(writable) ||
      !rules.loadStyleSheetContainer(custom)) {
    throw new Error('Failed to parse memory or callback rules');
  }
  console.log(`Callback stream: ${custom.tell()} / ${custom.length()} bytes`);
  document.setStyleSheetContainer(rules);
  document.show();
  return document;
}

async function run(frameLimit, screenshotPath) {
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(width, height)),
    'sfml.js-rmlui · byte streams',
    { settings: { stencilBits: 8 } });
  window.setFramerateLimit(60);
  try {
    if (!rmlui.initialise(window, { highDpi: false })) {
      throw new Error('RmlUi initialisation failed');
    }
    if (!rmlui.loadFontFace(path.join(__dirname,
      '../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf'))) {
      throw new Error('Failed to load LatoLatin-Regular');
    }
    const context = rmlui.createContext('streams', width, height);
    loadPanel(context);
    let running = true;
    for (let frame = 0;
      running && window.isOpen() && frame < frameLimit; ++frame) {
      let event;
      while ((event = window.pollEvent()) !== undefined) {
        if (event.is('Closed') || (event.is('KeyPressed') &&
            event.data.code === sfml.Keyboard.Key.Escape)) {
          running = false;
        }
        context.processEvent(event);
      }
      if (!running) {
        break;
      }
      context.update();
      window.clear(sfml.Color.Black);
      window.flush();
      context.render();
      if (screenshotPath && frame === frameLimit - 1) {
        const texture = new sfml.Texture(new sfml.Vector2u(width, height));
        texture.update(window);
        if (!await texture.copyToImage().saveToFile(screenshotPath)) {
          throw new Error(`Failed to write ${screenshotPath}`);
        }
      }
      window.display();
    }
    context.remove();
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

const { values } = parseArgs({
  options: {
    frames: { type: 'string' },
    screenshot: { type: 'string' },
  },
});
const frameLimit = values.frames === undefined
  ? Infinity : Number(values.frames);
if (values.frames !== undefined &&
    (!Number.isSafeInteger(frameLimit) || frameLimit < 1)) {
  throw new Error('--frames must be a positive integer');
}
run(frameLimit, values.screenshot).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
