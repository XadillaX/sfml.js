'use strict';

const rmlui = require('../../../../dist');

/**
 * Port Samples/basic/benchmark/src/main.cpp without changing its workload.
 * @param {object} context Native RmlUi context.
 * @param {object} options Random source and backend exit callback.
 * @param {Function} options.random Uniform random source.
 * @param {Function} options.requestExit Request backend termination.
 * @return {object} Document, independent update/render loop and cleanup.
 */
function createBenchmark(context, {
  random = Math.random, requestExit = () => {},
} = {}) {
  const key = rmlui.KeyIdentifier;
  let runLoop = true;
  let singleLoop = true;
  let runUpdate = true;
  let singleUpdate = true;
  let previousTime = 0;
  let countFrames = 0;
  const fpsBuffer = new Float32Array(200);
  let bufferIndex = 0;

  function processEvent(value, event) {
    if (value === 'exit') {
      requestExit();
    }
    if (event.type !== 'keydown') {
      return;
    }

    const identifier = event.getParameter('key_identifier', 0);
    if (identifier === key.KI_SPACE) {
      runLoop = !runLoop;
    } else if (identifier === key.KI_DOWN) {
      runLoop = false;
      singleLoop = true;
    } else if (identifier === key.KI_RIGHT) {
      runUpdate = false;
      singleUpdate = true;
    } else if (identifier === key.KI_RETURN) {
      runUpdate = !runUpdate;
    } else if (identifier === key.KI_ESCAPE) {
      requestExit();
    }
  }

  rmlui.Factory.registerEventListenerInstancer(
    new rmlui.EventListenerInstancer(value =>
      new rmlui.EventListener(event => processEvent(value, event))));
  const document = context.loadDocument('basic/benchmark/data/benchmark.rml');
  if (!document) {
    throw new Error('Could not load the upstream benchmark document');
  }
  document.getElementById('title').innerRML = 'Benchmark sample';
  for (const type of [ 'keydown', 'keyup', 'animationend' ]) {
    document.addEventListener(type, event => processEvent('hello', event));
  }
  document.show();

  function performanceTest() {
    let rml = '';
    for (let i = 0; i < 50; i++) {
      const index = Math.floor(random() * 1000);
      const route = Math.floor(random() * 50);
      const max = Math.floor(random() * 40) + 10;
      const value = Math.floor(random() * max);
      rml += `
        <div class="row">
          <div class="col col1"><button class="expand"
            index="${index}">+</button>&nbsp;<a>Route ${route}</a></div>
          <div class="col col23"><input type="range" class="assign_range"
            min="0" max="${max}" value="${value}"/></div>
          <div class="col col4">Assigned</div>
          <select>
            <option>Red</option><option>Blue</option>
            <option selected>Green</option>
            <option style="background-color: yellow;">Yellow</option>
          </select>
          <div class="inrow unmark_collapse">
            <div class="col col123 assign_text">Assign to route</div>
            <div class="col col4">
              <input type="submit" class="vehicle_depot_assign_confirm"
                quantity="0">Confirm</input>
            </div>
          </div>
        </div>`;
    }
    document.getElementById('performance').innerRML = rml;
  }

  return {
    document,

    /**
     * Regenerate rows independently, then render and sample the FPS ring.
     * @param {number|Function} elapsed Clock read after presentation.
     * @param {Function} present Render and present the backend frame.
     */
    frame(elapsed, present) {
      if (runUpdate || singleUpdate) {
        singleUpdate = false;
        performanceTest();
      }
      if (runLoop || singleLoop) {
        singleLoop = false;
        context.update();
        present();
      }

      const time = typeof elapsed === 'function' ? elapsed() : elapsed;
      const dt = Math.fround(time - previousTime);
      previousTime = time;
      countFrames++;
      fpsBuffer[bufferIndex] = Math.fround(1 / dt);
      bufferIndex = (bufferIndex + 1) % fpsBuffer.length;
      if (countFrames > fpsBuffer.length / 8) {
        let mean = 0;
        for (let i = 0; i < fpsBuffer.length; i++) {
          mean = Math.fround(mean +
            fpsBuffer[(bufferIndex + i) % fpsBuffer.length]);
        }
        mean = Math.fround(mean / fpsBuffer.length);
        countFrames = 0;
        document.getElementById('fps').innerRML = `FPS: ${mean.toFixed(6)}`;
      }
    },

    /** Close the same document owned by the upstream DemoWindow. */
    close() {
      document.close();
    },
  };
}

module.exports = { createBenchmark };
