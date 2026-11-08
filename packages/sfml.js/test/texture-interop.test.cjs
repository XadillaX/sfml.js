'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');

const V = sf.Vector2u;
const handle = value => value[graphicsNative];
const pixel = (image, x, y) => image.getPixel(new V(x, y)).toInteger();

test('Window lifecycle and Texture.update handle unopened and closed sources',
  () => {
    const window = new sf.Window();
    const texture = new sf.Texture(new sf.Image(new V(1, 1), sf.Color.Green));
    assert.equal(window.isOpen(), false);
    texture.update(window);
    texture.update(window, new V(99, 99));
    window.close();
    window.display();
    assert.equal(pixel(texture.copyToImage(), 0, 0),
      sf.Color.Green.toInteger());
    assert.throws(() => window.create(new V(), 'empty'), RangeError);
    assert.throws(() => window.create(new V(32, 32), 1), TypeError);
    window.create(new V(64, 32), 'Texture source');
    try {
      assert.equal(window.isOpen(), true);
      assert.equal(window.setActive(), true);
      assert.throws(() => window.setActive(1), TypeError);
      const size = window.getSize();
      assert.ok(size.x > 0 && size.y > 0);
      assert.throws(() => texture.update(window), RangeError);
      window.display();
    } finally {
      window.close();
    }
    texture.update(window);
    assert.equal(window.isOpen(), false);
    assert.equal(pixel(texture.copyToImage(), 0, 0),
      sf.Color.Green.toInteger());
  });

test('Window texture copies preserve orientation, offsets and recorded draws',
  () => {
    const window = new sf.Window(new V(64, 32), 'Texture copy');
    try {
      const size = window.getSize();
      native.paintWindow(handle(window));
      const texture = new sf.Texture(new sf.Image(size, sf.Color.Green));
      const target = new sf.RenderTexture(new V(size.x * 2, size.y));
      const sprite = new sf.Sprite(texture);
      target.clear();
      target.draw(sprite);
      texture.update(window);
      sprite.setPosition(new sf.Vector2f(size.x, 0));
      target.draw(sprite);
      target.display();
      const rendered = target.getTexture().copyToImage();
      assert.equal(pixel(rendered, 0, 0), sf.Color.Green.toInteger());
      assert.equal(pixel(rendered, size.x, 0), sf.Color.Blue.toInteger());
      assert.equal(pixel(rendered, size.x, size.y - 1),
        sf.Color.Red.toInteger());
      const padded = new sf.Texture(new sf.Image(
        new V(size.x + 4, size.y + 4), sf.Color.Green));
      padded.update(window, new V(2, 2));
      const image = padded.copyToImage();
      assert.equal(pixel(image, 2, 2), sf.Color.Blue.toInteger());
      assert.equal(pixel(image, 2, size.y + 1), sf.Color.Red.toInteger());
      assert.equal(pixel(image, 0, 0), sf.Color.Green.toInteger());
      assert.throws(() => padded.update(window, new V(5, 5)), RangeError);
      assert.throws(() => target.getTexture().update(window), /Cannot modify/);
    } finally {
      window.close();
    }
  });

test('Texture native GL handles and binding honor the active context and units',
  () => {
    const texture = new sf.Texture(new V(8, 4));
    const empty = new sf.Texture();
    const window = new sf.Window(new V(64, 32), 'Texture binding');
    try {
      assert.equal(empty.getNativeHandle(), 0);
      assert.ok(texture.getNativeHandle() > 0);
      const target = new sf.RenderTexture(new V(8, 4));
      const view = target.getTexture();
      target.clear(sf.Color.Blue);
      target.display();
      // Pending work must not switch away from the explicitly active window.
      target.clear(sf.Color.Green);
      assert.equal(window.setActive(), true);
      const before = native.readTextureBinding();
      sf.Texture.bind(texture);
      const normalized = native.readTextureBinding();
      assert.equal(normalized.binding, texture.getNativeHandle());
      assert.equal(normalized.context, before.context);
      assert.equal(normalized.matrix[0], 1);
      assert.equal(normalized.matrix[5], 1);
      sf.Texture.bind(texture, sf.CoordinateType.Pixels);
      const pixels = native.readTextureBinding();
      assert.equal(pixels.matrix[0], 1 / 8);
      assert.equal(pixels.matrix[5], 1 / 4);
      sf.Texture.bind(view);
      assert.equal(native.readTextureBinding().binding, view.getNativeHandle());
      // No implicit flush of the pending green clear.
      assert.equal(pixel(view.copyToImage(), 0, 0), sf.Color.Blue.toInteger());
      window.setActive();
      sf.Texture.bind(null);
      assert.equal(native.readTextureBinding().binding, 0);
      assert.throws(() => sf.Texture.bind(texture, 2), RangeError);
      assert.throws(() => sf.Texture.bind({}), TypeError);
      assert.throws(() => sf.Texture.bind(undefined), TypeError);
    } finally {
      window.close();
    }
  });
