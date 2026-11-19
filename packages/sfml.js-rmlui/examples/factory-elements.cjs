'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { parseArgs } = require('node:util');
const sfml = require('sfml.js');
const rmlui = require('../dist');

const width = 760;
const height = 480;

function panel(context) {
  const nativeInput = rmlui.Factory.getElementInstancer('input');
  assert.ok(nativeInput);
  const instancing = { allocated: 0, released: 0 };
  const customInput = new rmlui.ElementInstancer((parent, tag, attributes) => {
    ++instancing.allocated;
    return nativeInput.instanceElement(parent, tag, attributes);
  }, snapshot => {
    assert.equal(snapshot.tagName, 'account-field');
    ++instancing.released;
  });
  rmlui.Factory.registerElementInstancer('account-control', customInput);
  const document = context.createDocument();
  const rules = new rmlui.StreamMemory(Buffer.from(`
body { width:760px; height:480px; margin:0; background:#161e2a;
  font-family:LatoLatin; font-size:17px; color:#c4cddd; }
div { display:block; }
#heading { position:absolute; left:32px; top:28px;
  color:white; font-size:30px; }
#intro { position:absolute; left:32px; top:76px; color:#8f9db2; }
.panel { position:absolute; left:32px; width:696px; height:84px;
  background:#223147; border:1px #496077; border-radius:12px; }
#typed { top:130px; } #parsed { top:232px; } #streamed { top:334px; }
.label { position:absolute; left:18px; top:14px; color:white; }
.detail { position:absolute; left:18px; top:48px;
  font-size:14px; color:#8f9db2; }
account-field { position:absolute; left:365px; top:23px;
  width:282px; height:28px;
  padding:5px 8px; color:white; background:#161e2a; border:1px #7191ac;
  border-radius:5px; }
#footer { position:absolute; left:32px; top:441px; color:#8f9db2; }
`));
  const styles = rmlui.Factory.instanceStyleSheetStream(rules);
  assert.ok(styles);
  document.setStyleSheetContainer(styles);
  rmlui.Factory.instanceElementText(document, `
<div id="heading">Element factory</div>
<div id="intro">Native types · Independent tags · Owned parsed children</div>
<div class="panel" id="typed">
  <div class="label">Custom input instancer</div>
  <div class="detail">Tag: account-field · Native allocator preserved</div>
</div>
<div class="panel" id="parsed">
  <div class="label">Text and entity parsing</div>
  <div class="detail">RML entities decode into real child elements</div>
</div>
<div class="panel" id="streamed">
  <div class="label">Native stream parsing</div>
  <div class="detail">Cursor consumed · Stylesheet parsed from bytes</div>
</div>
<div id="footer">Type in the field · Space: update text · Escape: exit</div>
`);
  const typed = document.getElementById('typed');
  const input = rmlui.Factory.instanceElement(
    typed, 'account-control', 'account-field', {
      type: 'text', id: 'account', value: 'Native ownership',
    });
  assert.ok(input instanceof rmlui.ElementFormControlInput);
  assert.equal(input.getParentNode(), null);
  typed.appendChild(input);
  const stream = new rmlui.StreamMemory(Buffer.from(`
<rml><head/><body>
<div style="position:absolute; left:390px; top:29px; color:#a8d5cf;"
id="result">Stream: ready</div></body></rml>`));
  const parsed = rmlui.Factory.instanceDocumentStream(context, stream, 'body');
  assert.ok(parsed instanceof rmlui.Document);
  assert.equal(parsed.getParentNode(), null);
  assert.equal(context.getNumDocuments(), 1);
  const streamed = parsed.getElementById('result');
  parsed.removeChild(streamed);
  document.getElementById('streamed').appendChild(streamed);
  assert.equal(stream.tell(), stream.length());
  document.show();
  return {
    document, input, result: document.getElementById('result'), instancing,
  };
}

async function run(frameLimit, screenshot, exercise) {
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(width, height)), 'Element factory',
    { settings: { stencilBits: 8 } });
  window.setFramerateLimit(60);
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
    const allocator = new rmlui.ContextInstancer();
    const contextInstancing = { allocated: 0, released: 0 };
    rmlui.Factory.registerContextInstancer(
      new rmlui.ContextInstancer((name, manager, handler) => {
        ++contextInstancing.allocated;
        return allocator.instanceContext(name, manager, handler);
      }, snapshot => {
        assert.equal(snapshot.name, 'factory-elements');
        ++contextInstancing.released;
      }));
    const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
    const context = rmlui.Factory.instanceContext(
      'factory-elements', manager, null);
    assert.ok(context);
    assert.equal(rmlui.getNumContexts(), 0);
    context.setDimensions(width, height);
    const { document, input, result, instancing } = panel(context);
    const eventAllocator = new rmlui.EventInstancer();
    const eventInstancing = { allocated: 0, released: 0 };
    const saveType = 'account-save';
    rmlui.Factory.registerEventInstancer(
      new rmlui.EventInstancer((...args) => {
        if (args[2] === saveType) {
          ++eventInstancing.allocated;
        }
        return eventAllocator.instanceEvent(...args);
      }, snapshot => {
        if (snapshot.type === saveType) {
          ++eventInstancing.released;
        }
      }));
    const saveId = rmlui.registerEventType(saveType, true, true);
    const listenerInstancing = { allocated: 0, attached: 0, detached: 0 };
    rmlui.Factory.registerEventListenerInstancer(
      new rmlui.EventListenerInstancer((value, element) => {
        assert.match(value, /^account-save/);
        assert.equal(element, input);
        ++listenerInstancing.allocated;
        return new rmlui.EventListener(event => {
          assert.equal(event.target, input);
          result.innerRML = `Stream: edit ${event.getParameter('edit', 0)}`;
        }, snapshot => {
          assert.equal(snapshot.tagName, 'account-field');
          ++listenerInstancing.attached;
        }, snapshot => {
          assert.equal(snapshot.tagName, 'account-field');
          ++listenerInstancing.detached;
        });
      }));
    input.setAttribute('onaccount-save', saveType);
    const ownedEvent = rmlui.Factory.instanceEvent(
      input, saveId, saveType, { edit: 0 }, true);
    ownedEvent.setCurrentElement(input);
    ownedEvent.setPhase(rmlui.EventPhase.Target);
    assert.equal(ownedEvent.getParameter('edit', -1), 0);
    ownedEvent.release();
    const defaultEvent = new rmlui.RmlEvent();
    defaultEvent.setCurrentElement(input);
    const manualListener = new rmlui.EventListener(event => {
      assert.equal(event.target, null);
      assert.equal(event.currentTarget, input);
      assert.equal(event.id, rmlui.EventId.Invalid);
      assert.equal(event.getParameter('edit', -1), -1);
    });
    manualListener.processEvent(defaultEvent);
    defaultEvent.release();
    manualListener.release();
    let running = true;
    let edits = 0;
    for (let frame = 0;
      running && window.isOpen() && frame < frameLimit; ++frame) {
      let change = exercise && frame > 0 && frame % 3 === 0;
      let event;
      while ((event = window.pollEvent()) !== undefined) {
        if (event.is('Closed')) {
          running = false;
        } else if (event.is('KeyPressed')) {
          if (event.data.code === sfml.Keyboard.Key.Escape) {
            running = false;
          }
          if (event.data.code === sfml.Keyboard.Key.Space) {
            change = true;
          }
        }
        context.processEvent(event);
      }
      if (!running) {
        break;
      }
      if (change) {
        input.setValue(`Edited ${++edits}`);
        input.setAttribute('onaccount-save', `${saveType}:${edits}`);
        assert.equal(input.dispatchEvent(saveId, { edit: edits }), true);
        rmlui.Factory.clearStyleSheetCache();
        rmlui.Factory.clearTemplateCache();
        assert.equal(input.getValue(), `Edited ${edits}`);
      }
      context.update();
      assert.equal(input.tagName, 'account-field');
      assert.equal(input.getParentNode().id, 'typed');
      assert.equal(input.getComputedValues().width.value, 282);
      assert.ok(rmlui.Factory.isStructuralDataView('for'));
      window.clear(sfml.Color.Black);
      window.flush();
      context.render();
      if (screenshot && frame === frameLimit - 1) {
        window.flush();
        const texture = new sfml.Texture(new sfml.Vector2u(width, height));
        texture.update(window);
        const image = texture.copyToImage();
        assert.ok(image.pixels.some((byte, index) =>
          index % 4 !== 3 && byte > 100));
        assert.ok(await image.saveToFile(screenshot));
      }
      window.display();
    }
    document.close();
    context.remove();
    assert.equal(instancing.allocated, 1);
    assert.equal(instancing.released, instancing.allocated);
    assert.equal(contextInstancing.allocated, 1);
    assert.equal(contextInstancing.released, contextInstancing.allocated);
    assert.equal(eventInstancing.allocated, edits + 1);
    assert.equal(eventInstancing.released, eventInstancing.allocated);
    assert.equal(listenerInstancing.allocated, edits + 1);
    assert.equal(listenerInstancing.attached, listenerInstancing.allocated);
    assert.equal(listenerInstancing.detached, listenerInstancing.attached);
    console.log('Verified native context/input/event/listener allocation, ' +
      'inline attribute replacement, matching release/detach, ' +
      'default event/manual listener, ' +
      'owned document-stream parsing and caches');
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

const { values } = parseArgs({
  options: {
    frames: { type: 'string' },
    screenshot: { type: 'string' },
    exercise: { type: 'boolean', default: false },
  },
});
const frameLimit = values.frames === undefined
  ? Infinity : Number(values.frames);
if (values.frames !== undefined &&
    (!Number.isSafeInteger(frameLimit) || frameLimit < 1)) {
  throw new Error('--frames must be a positive integer');
}
run(frameLimit, values.screenshot, values.exercise).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
