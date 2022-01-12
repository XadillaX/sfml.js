'use strict';

const { Vector3F, Vector3I, Vector3U } = require('../lib/sfml');

{
  const vec = new Vector3I();
  console.log(vec);
  vec.x = 100.2;
  console.log(vec);
  const vec2 = new Vector3I(vec);
  console.log(vec2);
  const vec3 = new Vector3I(100, 2000000, 200);
  console.log(vec3);
  vec3.x = -1;
  console.log(vec3);
}

console.log('========================');

{
  const vec = new Vector3U();
  console.log(vec);
  vec.x = 100.2;
  console.log(vec);
  const vec2 = new Vector3U(vec);
  console.log(vec2);
  const vec3 = new Vector3U(100, 2000000, 200);
  console.log(vec3);
  try {
    new Vector3U(-1, 100, 300);
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
  const vec = new Vector3F();
  console.log(vec);
  vec.x = 100.2;
  console.log(vec);
  const vec2 = new Vector3F(vec);
  console.log(vec2);
  const vec3 = new Vector3F(100, 2000000, 200);
  console.log(vec3);
  vec3.x = -1;
  console.log(vec3);

  console.log(Vector3F.subtract(vec, vec3));
  console.log(Vector3F.add(vec, vec3));
  console.log(Vector3F.multiply(vec, 2));
  console.log(Vector3F.div(vec, 2));

  const vec4 = new Vector3F(vec);
  console.log(Vector3F.equals(vec4, vec));
  console.log(Vector3F.notEquals(vec4, vec));
  console.log(Vector3F.equals(vec4, vec3));
  console.log(Vector3F.notEquals(vec4, vec3));
}
