'use strict';

const { Vector2I, Vector2U, Vector2F } = require('../lib/sfml');

{
  const vec = new Vector2I();
  console.log(vec);
  vec.x = 100.2;
  console.log(vec);
  const vec2 = new Vector2I(vec);
  console.log(vec2);
  const vec3 = new Vector2I(100, 2000000);
  console.log(vec3);
  vec3.x = -1;
  console.log(vec3);
}

console.log('========================');

{
  const vec = new Vector2U();
  console.log(vec);
  vec.x = 100.2;
  console.log(vec);
  const vec2 = new Vector2U(vec);
  console.log(vec2);
  const vec3 = new Vector2U(100, 2000000);
  console.log(vec3);
  try {
    new Vector2U(-1, 100);
  } catch (e) {
    console.error(e);
  }

  try {
    vec3.x = -1;
  } catch (e) {
    console.error(e);
  }
}

console.log('========================');

{
  const vec = new Vector2F();
  console.log(vec);
  vec.x = 100.2;
  console.log(vec);
  const vec2 = new Vector2F(vec);
  console.log(vec2);
  const vec3 = new Vector2F(100, 2000000);
  console.log(vec3);
  vec3.x = -1;
  console.log(vec3);
}
