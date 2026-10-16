'use strict';

const { FloatRect, IntRect, Vector2f, Vector2i } = require('../..');

{
  const rect = new IntRect();
  console.log(rect);
  rect.size.x = 100;
  try {
    rect.size.y = 'a';
  } catch (e) {
    console.error(e);
  }
  console.log(rect);
  rect.size.y = 100;
  console.log(rect);

  console.log(rect.contains(new Vector2i(30, 30)));
  console.log(rect.contains(new Vector2i(100, 101)));
  console.log(rect.contains(new Vector2i(30, 30)));
  console.log(rect.contains(new Vector2i(30, 30)));

  const rect2 = new IntRect(new Vector2i(50, 50), new Vector2i(100, 100));
  console.log(rect2);
  console.log(rect.findIntersection(rect2));
  rect2.position.y = 101;
  rect2.position.x = 101;
  console.log(rect2);
  console.log(rect.findIntersection(rect2));
}

console.log('========================');

{
  const rect = new FloatRect();
  console.log(rect);
  rect.size.x = 100.1;
  try {
    rect.size.y = 'a';
  } catch (e) {
    console.error(e);
  }
  console.log(rect);
  rect.size.y = 100.1;
  console.log(rect);

  console.log(rect.contains(new Vector2f(30.2, 30.3)));
  console.log(rect.contains(new Vector2f(100, 101)));
  console.log(rect.contains(new Vector2f(30.4, 30.5)));
  console.log(rect.contains(new Vector2f(30.6, 30.7)));

  const rect2 = new FloatRect(
    new Vector2f(50.1, 50.1), new Vector2f(100.1, 100.1));
  console.log(rect2);
  console.log(rect.findIntersection(rect2));
  rect2.position.y = 101;
  rect2.position.x = 101;
  console.log(rect2);
  console.log(rect.findIntersection(rect2));
}
