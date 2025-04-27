'use strict';

const path = require('path');

const { IntRect, Sprite, Texture } = require('../lib/sfml');

(async () => {
  // 为每个加载操作创建单独的 Texture 对象
  const texture = new Texture();
  const texture2 = new Texture();
  const texture3 = new Texture();
  const texture4 = new Texture();

  // 测试错误处理
  const ret = await Promise.allSettled([
    texture3.loadFromFile('abc.jpg'),
    texture4.loadFromFile('abc.jpg'),
  ]);
  console.log(ret);

  await Promise.all([
    texture.loadFromFile(path.join(__dirname, 'avatar.gif')),
    texture2.loadFromFile(
      path.join(__dirname, 'avatar.gif'),
      new IntRect(0, 0, 10, 10)),
  ]);

  console.log(texture.getSize());
  console.log(texture2.getSize());

  texture.updateByTexture(texture2);

  const sprite = new Sprite();
  sprite.setTexture(texture);
  sprite.setTextureRect(new IntRect(0, 0, 10, 10));
})();
