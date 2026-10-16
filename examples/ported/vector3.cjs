'use strict';

const {
  Vector3f, Vector3i, Vector3u,
  subtract, add, multiply, divide, equal, notEqual,
} = require('../..');

{
  const vec = new Vector3i();
  console.log(vec);
  vec.x = 100.2;
  console.log(vec);
  const vec2 = new Vector3i(vec);
  console.log(vec2);
  const vec3 = new Vector3i(100, 2000000, 200);
  console.log(vec3);
  vec3.x = -1;
  console.log(vec3);
}

console.log('========================');

{
  const vec = new Vector3u();
  console.log(vec);
  vec.x = 100.2;
  console.log(vec);
  const vec2 = new Vector3u(vec);
  console.log(vec2);
  const vec3 = new Vector3u(100, 2000000, 200);
  console.log(vec3);
  try {
    new Vector3u(-1, 100, 300);
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
  const vec = new Vector3f();
  console.log(vec);
  vec.x = 100.2;
  console.log(vec);
  const vec2 = new Vector3f(vec);
  console.log(vec2);
  const vec3 = new Vector3f(100, 2000000, 200);
  console.log(vec3);
  vec3.x = -1;
  console.log(vec3);
  console.log(subtract(vec, vec3));
  console.log(add(vec, vec3));
  console.log(multiply(vec, 2));
  console.log(divide(vec, 2));
  const vec4 = new Vector3f(vec);
  console.log(equal(vec4, vec));
  console.log(notEqual(vec4, vec));
  console.log(equal(vec4, vec3));
  console.log(notEqual(vec4, vec3));
}
