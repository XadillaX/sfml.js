'use strict';

const { Color } = require('./color');
const { Drawable } = require('./drawable/drawable');
const { RenderWindow: _RenderWindow } = require('../build/Release/binding.node');
const { validateTypeOf } = require('./common');
const { VideoMode } = require('./video_mode');

const DRAW_DRAWABLE = Symbol('RenderWindow::drawDrawable');
const RAW_RENDER_WINDOW = Symbol('RenderWindow::rawRenderWindow');

class RenderWindow {
  constructor(videoMode, title, style) {
    validateTypeOf(videoMode, 'videoMode', VideoMode, true);
    validateTypeOf(title, 'title', 'string', true);
    validateTypeOf(style, 'style', 'number', true);

    if (videoMode === undefined) {
      this[RAW_RENDER_WINDOW] = new _RenderWindow();
    } else if (style === undefined) {
      videoMode = videoMode[VideoMode.RAW_VIDEO_MODE];
      this[RAW_RENDER_WINDOW] = new _RenderWindow(videoMode, title);
    } else {
      videoMode = videoMode[VideoMode.RAW_VIDEO_MODE];
      this[RAW_RENDER_WINDOW] = new _RenderWindow(videoMode, title, style);
    }
  }

  capture() {
    return this[RAW_RENDER_WINDOW].capture();
  }

  clear(color = 0) {
    if (!(color instanceof Color)) {
      color = new Color(color);
    }

    this[RAW_RENDER_WINDOW].clear(color);
  }

  close() {
    this[RAW_RENDER_WINDOW].close();
  }

  draw(content) {
    if (content instanceof Drawable) {
      return this[DRAW_DRAWABLE](content);
    }
  }

  [DRAW_DRAWABLE](content) {
    this[RAW_RENDER_WINDOW].drawDrawable(content._raw());
  }

  display() {
    this[RAW_RENDER_WINDOW].display();
  }

  isOpen() {
    return this[RAW_RENDER_WINDOW].isOpen();
  }

  pollEvent() {
    return this[RAW_RENDER_WINDOW].pollEvent();
  }

  setVisible(visible) {
    validateTypeOf(visible, 'visible', 'boolean');
    this[RAW_RENDER_WINDOW].setVisible(visible);
  }

  setVerticalSyncEnabled(enabled) {
    validateTypeOf(enabled, 'enabled', 'boolean');
    this[RAW_RENDER_WINDOW].setVerticalSyncEnabled(enabled);
  }

  setMouseCursorVisible(visible) {
    validateTypeOf(visible, 'visible', 'boolean');
    this[RAW_RENDER_WINDOW].setMouseCursorVisible(visible);
  }

  setMouseCursorGrabbed(grabbed) {
    validateTypeOf(grabbed, 'grabbed', 'boolean');
    this[RAW_RENDER_WINDOW].setMouseCursorGrabbed(grabbed);
  }

  setKeyRepeatEnabled(enabled) {
    validateTypeOf(enabled, 'enabled', 'boolean');
    this[RAW_RENDER_WINDOW].setKeyRepeatEnabled(enabled);
  }

  setFramerateLimit(limit) {
    validateTypeOf(limit, 'limit', 'number');
    if (limit < 0) {
      throw new RangeError('Limit should >= 0.');
    }

    limit = parseInt(limit);
    this[RAW_RENDER_WINDOW].setFramerateLimit(limit);
  }

  setActive(active = true) {
    validateTypeOf(active, 'active', 'boolean');
    this[RAW_RENDER_WINDOW].setActive(active);
  }

  getSize() {
    return this[RAW_RENDER_WINDOW].getSize();
  }

  hasFocus() {
    return this[RAW_RENDER_WINDOW].hasFocus();
  }
}

RenderWindow.Style = _RenderWindow.Style;
RenderWindow.RAW_RENDER_WINDOW = RAW_RENDER_WINDOW;

module.exports = { RenderWindow };
