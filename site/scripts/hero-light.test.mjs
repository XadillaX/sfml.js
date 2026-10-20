import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  imagePointToViewport,
  lanternPoint,
} from '../.vitepress/theme/hero-light.mjs';

test('cover mapping accounts for horizontal ' +
     'cropping and object-position', () => {
  const point = imagePointToViewport({
    imageWidth: 2000, imageHeight: 1000,
    viewportWidth: 1000, viewportHeight: 800,
    positionX: 0.65, positionY: 0.54,
    pointX: 1500, pointY: 600,
  });
  assert.equal(point.x, 810);
  assert.equal(point.y, 480);
  assert.equal(point.scale, 0.8);
});

test('cover mapping accounts for vertical cropping', () => {
  const point = imagePointToViewport({
    imageWidth: 2000, imageHeight: 1000,
    viewportWidth: 1600, viewportHeight: 600,
    positionX: 0.65, positionY: 0.54,
    pointX: 1500, pointY: 600,
  });
  assert.equal(point.x, 1200);
  assert.equal(point.y, 372);
});

test('mobile lamp coordinates follow the source ' +
     'crop instead of the desktop percentages', () => {
  const point = lanternPoint(true);
  // Original image lamp (2165.33, 876); mobile crop starts at x=1650.
  assert.ok(Math.abs(point.x - 399) < 0.1);
  assert.ok(Math.abs(point.y - 678.29) < 0.1);
  const desktop = lanternPoint(false);
  assert.equal(desktop.x, 1624);
  assert.equal(desktop.y, 657);
});

test('empty or unloaded image dimensions do not ' +
     'produce invalid canvas coordinates', () => {
  assert.equal(imagePointToViewport({
    imageWidth: 0, imageHeight: 0,
    viewportWidth: 1000, viewportHeight: 600,
    positionX: 0.5, positionY: 0.5,
    pointX: 0, pointY: 0,
  }), undefined);
});
