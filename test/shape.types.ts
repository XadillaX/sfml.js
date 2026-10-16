import {
  Shape, CircleShape, RectangleShape, ConvexShape, Drawable,
  Vector2f, Vector2u, Color, IntRect, RenderTexture, RenderTarget,
  RenderStates, Texture, degrees, type ReadonlyValue, type ReadonlyTexture,
} from '../src';

class Triangle extends Shape {
  constructor() { super(); this.update(); }
  getPointCount(): number { return 3; }
  getPoint(index: number): Vector2f {
    return [ new Vector2f(), new Vector2f(4, 0), new Vector2f(0, 4) ][index];
  }
  protected draw(target: RenderTarget, states: RenderStates): void {
    states.transform.translate(new Vector2f(1, 1));
    super.draw(target, states);
  }
}

const circle = new CircleShape({ radius: 5, pointCount: 8 });
const rectangle = new RectangleShape(new Vector2f(5, 6));
const convex = new ConvexShape(3);
circle.setRadius(7);
circle.setPointCount(12);
rectangle.setSize(new Vector2f(8, 9));
convex.setPoint(0, new Vector2f());
convex.setPointCount(4);
const readonlyCircle: ReadonlyValue<CircleShape> = circle;
const copies = [
  new CircleShape(readonlyCircle),
  new RectangleShape(rectangle),
  new ConvexShape(convex),
];
const target = new RenderTexture(new Vector2u(16, 16));
for (const shape of [ circle, rectangle, convex, new Triangle(), ...copies ]) {
  const base: Shape = shape;
  const drawable: Drawable = base;
  shape.setTexture(new Texture());
  shape.setTexture(null);
  shape.setTextureRect(new IntRect());
  shape.setFillColor(Color.Red);
  shape.setOutlineColor(Color.Blue);
  shape.setOutlineThickness(-1);
  shape.setMiterLimit(2);
  shape.setPosition(new Vector2f());
  shape.rotate(degrees(30));
  const texture: ReadonlyTexture | null = shape.getTexture();
  const rect: ReadonlyValue<IntRect> = shape.getTextureRect();
  shape.getLocalBounds().size.x = 10;
  shape.getGlobalBounds().size.x = 10;
  shape.getGeometricCenter().x = 10;
  target.draw(drawable);
  target.draw(base, RenderStates.Default);
  void [ texture, rect ];
}

// @ts-expect-error Shape is abstract and its constructor is protected.
new Shape();
// @ts-expect-error A custom shape must define both point methods.
class Incomplete extends Shape {}
// @ts-expect-error Geometry updates belong to subclasses.
circle.update();
// @ts-expect-error draw is dispatched through a RenderTarget.
circle.draw(target, new RenderStates());
// @ts-expect-error Circle construction uses named options.
new CircleShape(5, 8);
// @ts-expect-error Shape sizes are floating point vectors.
new RectangleShape(new Vector2u(5, 6));
// @ts-expect-error Readonly shapes cannot change geometry.
readonlyCircle.setRadius(2);
// @ts-expect-error Readonly shapes cannot change appearance.
readonlyCircle.setFillColor(Color.Red);
// @ts-expect-error Rectangle views are readonly.
circle.getTextureRect().size.x = 10;
// @ts-expect-error Copies require the same concrete shape.
new CircleShape(rectangle);
void Incomplete;
