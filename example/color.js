'use strict';

const { Color } = require('../lib/sfml');

{
  const color = new Color();
  console.log(color);
  color.r = 255;
  console.log(color);
}

{
  const color = new Color(1234567);
  console.log({ a: color });
  console.log(JSON.stringify(color));
}
