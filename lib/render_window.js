'use strict';

const { Color } = require('./color');
const { Drawable } = require('./drawable/drawable');
const {
  RenderWindow: _RenderWindow,
} = require('../build/Release/binding.node');
const { validateTypeOf } = require('./common');
const { VideoMode } = require('./video_mode');
const { Vector2I } = require('./vector2');

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

  create(videoMode, title, style) {
    if (Number.isInteger(videoMode) && videoMode >= 0) {
      this[RAW_RENDER_WINDOW].create(videoMode);
    } else {
      validateTypeOf(videoMode, 'videoMode', VideoMode, false);
      validateTypeOf(title, 'title', 'string', false);
      validateTypeOf(style, 'style', 'number', true);

      videoMode = videoMode[VideoMode.RAW_VIDEO_MODE];
      if (style === undefined) {
        this[RAW_RENDER_WINDOW].create(videoMode, title);
      } else {
        this[RAW_RENDER_WINDOW].create(videoMode, title, style);
      }
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

  drawAsync(content) {
    if (content instanceof Drawable) {
      return new Promise((resolve, reject) => {
        this[RAW_RENDER_WINDOW].drawDrawableAsync((err, res) => {
          err ? reject(new Error(err)) : resolve(res);
        }, content._raw());
      });
    }
    return Promise.reject(new Error('Expected Drawable Instance'));
  }

  display() {
    this[RAW_RENDER_WINDOW].display();
  }

  displayAsync() {
    return new Promise((resolve, reject) => {
      this[RAW_RENDER_WINDOW].displayAsync((err, res) => {
        err ? reject(new Error(err)) : resolve(res);
      });
    });
  }

  getPosition() {
    return this[RAW_RENDER_WINDOW].getPosition();
  }

  getSettings() {
    return this[RAW_RENDER_WINDOW].getSettings();
  }

  isOpen() {
    return this[RAW_RENDER_WINDOW].isOpen();
  }

  pollEvent() {
    return this[RAW_RENDER_WINDOW].pollEvent();
  }

  requestFocus() {
    this[RAW_RENDER_WINDOW].requestFocus();
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

  setIcon(width, height, icon) {
    validateTypeOf(width, 'width', 'number', false);
    validateTypeOf(height, 'height', 'number', false);
    validateTypeOf(icon, 'icon', Buffer, false);

    if (icon.byteLength !== 4 * width * height) {
      throw new Error('Invalid icon size, must be 4 * width * height');
    }

    this[RAW_RENDER_WINDOW].setIcon(width, height, icon);
  }

  setJoystickThreshold(threshold) {
    validateTypeOf(threshold, 'threshold', 'number', false);
    this[RAW_RENDER_WINDOW].setJoystickThreshold(threshold);
  }

  setPosition(position) {
    validateTypeOf(position, 'position', Vector2I, false);
    this[RAW_RENDER_WINDOW].setPosition(position);
  }

  setTitle(title) {
    validateTypeOf(title, 'title', 'string', false);
    this[RAW_RENDER_WINDOW].setTitle(title);
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
