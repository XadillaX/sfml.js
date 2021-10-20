'use strict';

const path = require('path');

const { Sprite, Texture, IntRect } = require('../lib/sfml');

(async () => {
  const texture = new Texture();
  const texture2 = new Texture();

  const ret = await Promise.allSettled([
    texture.loadFromFile('abc.jpg'),
    texture.loadFromFile('abc.jpg'),
  ]);
  console.log(ret);

  await Promise.all([
    texture.loadFromFile(path.join(__dirname, 'avatar.gif')),
    texture2.loadFromFile(path.join(__dirname, 'avatar.gif'), new IntRect(0, 0, 10, 10)),
  ]);

  console.log(texture.getSize());
  console.log(texture2.getSize());

  texture.updateByTexture(texture2);

  const sprite = new Sprite();
  sprite.setTexture(texture);
  sprite.setTextureRect(new IntRect(0, 0, 10, 10));
})();
