'use strict';

const { Vertex, VertexArray } = require('../lib/sfml');

const vertex1 = new Vertex();
console.log(vertex1);

const temp = vertex1.texCoords;

vertex1.color.a = 100;
vertex1.color = 0xff7800ff;
vertex1.position.x = 100;
vertex1.texCoords = { x: 100, y: 512 };
vertex1.texCoords.x = 256;
temp.x = 12;
console.log(temp);
console.log(vertex1);

const va = new VertexArray();
va.resize(10);
try {
  va.setPosition(10, { x: 10, y: 10 });
} catch (e) {
  console.error(e);
}

va.setPosition(9, { x: 10, y: 10 });
va.setTexCoords(9, { x: 10, y: 10 });
va.setColor(9, 0xff7800ff);

console.log(va);
