'use strict';

const { FloatRect, IntRect } = require('../lib/sfml');

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

  const rect2 = new IntRect({ x: 50, y: 50 }, { x: 100, y: 100 });
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

  console.log(rect.contains(30, 30));
  console.log(rect.contains(100, 101));

  const rect2 = new FloatRect({ x: 50.1, y: 50.1 }, { x: 100.1, y: 100.1 });
  console.log(rect2);
  console.log(rect.intersects(rect2));

  rect2.top = 101;
  rect2.left = 101;

  console.log(rect2);
  console.log(rect.intersects(rect2));
}
