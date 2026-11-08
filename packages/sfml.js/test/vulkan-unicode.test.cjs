'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Vulkan, Unicode } = require('..');

test('Vulkan reports unavailable functions without exposing null pointers',
  () => {
    assert.ok(Vulkan, 'Vulkan helpers must be exported');
    assert.equal(Vulkan.getFunction('vkSFMLJSFunctionThatDoesNotExist'),
      undefined);
    assert.equal(typeof Vulkan.isAvailable(), 'boolean');
    assert.equal(typeof Vulkan.isAvailable(false), 'boolean');
    const extensions = Vulkan.getGraphicsRequiredInstanceExtensions();
    assert.ok(Array.isArray(extensions));
    assert.ok(extensions.every(name => typeof name === 'string'));
    extensions.push('caller mutation');
    assert.ok(!Vulkan.getGraphicsRequiredInstanceExtensions()
      .includes('caller mutation'));
    if (process.platform === 'darwin') {
      assert.equal(Vulkan.isAvailable(), false);
      assert.equal(Vulkan.isAvailable(false), false);
      assert.equal(Vulkan.getFunction('vkCreateInstance'), undefined);
      assert.deepEqual(Vulkan.getGraphicsRequiredInstanceExtensions(), []);
    }
  });

test('Vulkan rejects invalid loader flags and names', () => {
  assert.ok(Vulkan, 'Vulkan helpers must be exported');
  assert.throws(() => Vulkan.isAvailable(1), TypeError);
  for (const value of [ '', 'vk\0CreateInstance', null, 12 ]) {
    assert.throws(() => Vulkan.getFunction(value), TypeError);
  }
});

test('Unicode grapheme boundaries preserve combining marks and UTF-16 pairs',
  () => {
    assert.ok(Unicode, 'Unicode boundary helpers must be exported');
    for (const [ text, expected ] of [
      [ 'a\u0301b', [ true, false, true, true ]],
      [ '😀a', [ true, false, true, true ]],
      [ '\r\nx', [ true, false, true, true ]],
      [ '\ud800\u0301b', [ true, false, true, true ]],
      [ 'a\0b', [ true, true, true, true ]],
      [ '', [ true ]],
    ]) {
      assert.deepEqual(Array.from({ length: text.length + 1 },
        (_, index) => Unicode.isGraphemeBoundary(text, index)), expected);
    }
  });

test('Unicode word and sentence boundaries use positions before characters',
  () => {
    assert.ok(Unicode, 'Unicode boundary helpers must be exported');
    assert.equal(Unicode.isWordBoundary('hello world', 2), false);
    assert.equal(Unicode.isWordBoundary('hello world', 6), true);
    assert.equal(Unicode.isSentenceBoundary('Hi. There.', 2), false);
    assert.equal(Unicode.isSentenceBoundary('Hi. There.', 4), true);
    for (const check of [
      Unicode.isGraphemeBoundary, Unicode.isWordBoundary,
      Unicode.isSentenceBoundary,
    ]) {
      assert.equal(check('😀a', 1), false);
      assert.equal(check('', 0), true);
      assert.equal(check('a', 0), true);
      assert.equal(check('a', 1), true);
    }
  });

test('Unicode rejects invalid positions instead of entering native bounds',
  () => {
    assert.ok(Unicode, 'Unicode boundary helpers must be exported');
    for (const check of [
      Unicode.isGraphemeBoundary, Unicode.isWordBoundary,
      Unicode.isSentenceBoundary,
    ]) {
      assert.throws(() => check(null, 0), TypeError);
      for (const index of [ -1, 0.5, NaN, Infinity, 4 ]) {
        assert.throws(() => check('abc', index), RangeError);
      }
    }
  });
