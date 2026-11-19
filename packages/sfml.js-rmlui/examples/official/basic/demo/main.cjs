'use strict';

const rmlui = require('../../../../dist');
const { DemoWindow } = require('./DemoWindow.cjs');
const { createDemoEventListenerInstancer } = require('./DemoEventListener.cjs');

/**
 * Port Samples/basic/demo/src/main.cpp with its original application files.
 * @param {object} context Native RmlUi context.
 * @param {object} options Backend exit callback and random source.
 * @param {Function} options.requestExit Request backend termination.
 * @param {Function} options.random Uniform random source.
 * @return {DemoWindow} Original document, pre-event update and shutdown.
 */
function createDemo(context, {
  requestExit = () => {}, random = Math.random,
} = {}) {
  const demoWindow = new DemoWindow(requestExit);
  rmlui.Factory.registerEventListenerInstancer(
    createDemoEventListenerInstancer(demoWindow, random));
  demoWindow.initialize('Demo sample', context);
  for (const type of [ 'keydown', 'keyup', 'animationend' ]) {
    demoWindow.document.addEventListener(type,
      event => demoWindow.processEvent(event));
  }
  return demoWindow;
}

module.exports = { createDemo };
