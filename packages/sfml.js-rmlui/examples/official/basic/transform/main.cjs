'use strict';

const rmlui = require('../../../../dist');
const { DemoWindow } = require('./demo-window.cjs');

/**
 * Rotate both upstream windows after presentation, at 50 degrees per second.
 * @param {object} context Live RmlUi context.
 * @param {object} options Application exit request.
 * @param {Function} options.requestExit Stop the backend loop.
 * @return {object} Documents, original frame loop and shutdown hook.
 */
function createTransform(context, { requestExit = () => {} } = {}) {
  const first = new DemoWindow('Orthographic transform',
    { x: 120, y: 180 }, context);
  const second = new DemoWindow('Perspective transform',
    { x: 900, y: 180 }, context);
  second.setPerspective(800);
  let rotating = true;
  let previous;
  let degrees = 0;
  const root = context.getRootElement();

  function processEvent(event) {
    const key = event.parameters.key_identifier;
    if (key === rmlui.KeyIdentifier.KI_SPACE) {
      rotating = !rotating;
    } else if (key === rmlui.KeyIdentifier.KI_ESCAPE) {
      requestExit();
    }
  }
  root.addEventListener('keydown', processEvent);

  return {
    document: first.document,
    documents: [ first.document, second.document ],
    frame(time, present) {
      context.update();
      present();
      const now = typeof time === 'function' ? time() : time;
      previous ??= now;
      const dt = now - previous;
      previous = now;
      if (rotating) {
        degrees = Math.fround((degrees + dt * 50) % 360);
        first.setRotation(degrees);
        second.setRotation(degrees);
      }
    },
    close() {
      root.removeEventListener('keydown', processEvent);
      first.close();
      second.close();
    },
  };
}

module.exports = { createTransform };
