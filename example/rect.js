'use strict';

const { FloatRect, IntRect, Vector2F, Vector2I } = require('../lib/sfml');

{
  const rect = new IntRect();
  console.log(rect);
  rect.width = 100;
  try {
    rect.height = 'a';
  } catch (e) {
    console.error(e);
  }
  console.log(rect);
  rect.height = 100;
  console.log(rect);

  console.log(rect.contains(30, 30));
  console.log(rect.contains(100, 101));
  console.log(rect.contains({ x: 30, y: 30 }));
  console.log(rect.contains(new Vector2I(30, 30)));

  const rect2 = new IntRect({ x: 50, y: 50 }, new Vector2I(100, 100));
  console.log(rect2);
  console.log(rect.intersects(rect2));

  rect2.top = 101;
  rect2.left = 101;

  console.log(rect2);
  console.log(rect.intersects(rect2));
}

console.log('========================');

{
  const rect = new FloatRect();
  console.log(rect);
  rect.width = 100.1;
  try {
    rect.height = 'a';
  } catch (e) {
    console.error(e);
  }
  console.log(rect);
  rect.height = 100.1;
  console.log(rect);

  console.log(rect.contains(30.2, 30.3));
  console.log(rect.contains(100, 101));
  console.log(rect.contains({ x: 30.4, y: 30.5 }));
  console.log(rect.contains(new Vector2F(30.6, 30.7)));

  const rect2 = new FloatRect({ x: 50.1, y: 50.1 }, new Vector2F(100.1, 100.1));
  console.log(rect2);
  console.log(rect.intersects(rect2));

  rect2.top = 101;
  rect2.left = 101;

  console.log(rect2);
  console.log(rect.intersects(rect2));
}
