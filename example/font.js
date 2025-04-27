'use strict';

const path = require('path');

const { Font } = require('../lib/sfml');

// 使用异步函数包装代码
async function runExample() {
  const font = new Font();

  try {
    // 尝试加载不存在的字体文件，会失败但不会崩溃
    await font.loadFromFile('abcdefg').catch(err => {
      console.log('加载失败:', err.message);
    });
    console.log('第一次尝试后的字体:', font);

    // 加载正确的字体文件
    await font.loadFromFile(path.join(__dirname, 'font.ttf'));
    console.log('加载成功后的字体:', font);

    // 获取字体信息
    console.log('字形信息:', font.getGlyph(1, 10, false, 0));
    console.log('行间距:', font.getLineSpacing(10));
  } catch (err) {
    console.error('发生错误:', err);
  }
}

// 运行示例
runExample();
