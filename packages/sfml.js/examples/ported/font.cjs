'use strict';

const path = require('node:path');
const { Font } = require('../..');

async function runExample() {
  const font = new Font();
  try {
    if (!await font.openFromFile('abcdefg')) {
      console.log('加载失败:', 'openFromFile 返回 false');
    }
    console.log('第一次尝试后的字体:', font);
    if (!await font.openFromFile(path.join(__dirname, 'assets/font.ttf'))) {
      throw new Error('字体加载失败');
    }
    console.log('加载成功后的字体:', font);
    console.log('字形信息:', font.getGlyph(1, 10, false, 0));
    console.log('行间距:', font.getLineSpacing(10));
  } catch (err) {
    console.error('发生错误:', err);
  }
}

runExample();
