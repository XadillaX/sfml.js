'use strict';

const { RenderWindow: _RenderWindow } = require('../build/Release/binding.node');
const { validateTypeOf } = require('./common');
const VideoMode = require('./video_mode');
const Color = require('./color');
const Drawable = require('./drawable/base');

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

  // TODO(XadillaX): Color object.
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
    this[RAW_RENDER_WINDOW].drawDrawable(content[Drawable.RAW]);
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
}

RenderWindow.Style = _RenderWindow.Style;

module.exports = RenderWindow;
