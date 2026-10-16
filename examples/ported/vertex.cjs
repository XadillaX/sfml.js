'use strict';

const { Vertex, VertexArray, Vector2f, Color } = require('../..');

const vertex1 = new Vertex();
console.log(vertex1);
const temp = vertex1.texCoords;
vertex1.color.a = 100;
vertex1.color = new Color(0xff7800ff);
vertex1.position.x = 100;
vertex1.texCoords = new Vector2f(100, 512);
vertex1.texCoords.x = 256;
temp.x = 12;
console.log(temp);
console.log(vertex1);

const va = new VertexArray();
va.resize(10);
try {
  va.getVertex(10).position = new Vector2f(10, 10);
} catch (e) {
  console.error(e);
}
va.getVertex(9).position = new Vector2f(10, 10);
va.getVertex(9).texCoords = new Vector2f(10, 10);
va.getVertex(9).color = new Color(0xff7800ff);
console.log(va);
