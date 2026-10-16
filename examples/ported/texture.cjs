'use strict';

const path = require('node:path');
const { IntRect, Sprite, Texture, Vector2i } = require('../..');

async function main() {
  const texture = new Texture();
  const texture2 = new Texture();
  const texture3 = new Texture();
  const texture4 = new Texture();
  const ret = await Promise.allSettled([
    texture3.loadFromFile('abc.jpg'),
    texture4.loadFromFile('abc.jpg'),
  ]);
  console.log(ret);
  const loaded = await Promise.all([
    texture.loadFromFile(path.join(__dirname, 'assets/avatar.gif')),
    texture2.loadFromFile(path.join(__dirname, 'assets/avatar.gif'), false,
      new IntRect(new Vector2i(0, 0), new Vector2i(10, 10))),
  ]);
  if (loaded.some(ok => !ok)) throw new Error('Failed to load avatar.gif');
  console.log(texture.getSize());
  console.log(texture2.getSize());
  texture.update(texture2);
  const sprite = new Sprite(texture);
  sprite.setTextureRect(new IntRect(new Vector2i(0, 0), new Vector2i(10, 10)));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
