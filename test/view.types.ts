import {
  View, RenderTarget, RenderTexture, FloatRect, IntRect, Vector2f, Vector2i,
  Vector2u, Angle, degrees, Transform, type ReadonlyValue,
} from '../src';

const view = new View();
new View(new FloatRect());
new View(new Vector2f(), new Vector2f(8, 8));
new View(view);
view.setCenter(new Vector2f());
view.setSize(new Vector2f(20, 10));
view.setRotation(degrees(20));
view.setViewport(new FloatRect());
view.setScissor(new FloatRect());
view.move(new Vector2f());
view.rotate(degrees(20));
view.zoom(2);
const center: Vector2f = view.getCenter();
const size: Vector2f = view.getSize();
const rotation: Angle = view.getRotation();
const viewport: ReadonlyValue<FloatRect> = view.getViewport();
const scissor: ReadonlyValue<FloatRect> = view.getScissor();
const transform: ReadonlyValue<Transform> = view.getTransform();
const inverse: ReadonlyValue<Transform> = view.getInverseTransform();
const target: RenderTarget = new RenderTexture(new Vector2u(20, 10));
target.setView(view);
target.setView(target.getDefaultView());
const current: ReadonlyValue<View> = target.getView();
const defaultView: ReadonlyValue<View> = target.getDefaultView();
new View(current);
const vp: IntRect = target.getViewport(current);
const clip: IntRect = target.getScissor(current);
const world: Vector2f = target.mapPixelToCoords(new Vector2i());
target.mapPixelToCoords(new Vector2i(), defaultView);
const pixel: Vector2i = target.mapCoordsToPixel(new Vector2f(), current);
target.mapCoordsToPixel(new Vector2f());
const active: boolean = target.setActive();
const srgb: boolean = target.isSrgb();
target.pushGLStates();
target.popGLStates();
target.resetGLStates();
// @ts-expect-error Const target view cannot be mutated.
current.setCenter(new Vector2f());
// @ts-expect-error Const scissor members cannot be mutated.
scissor.position.x = 1;
// @ts-expect-error Const transform cannot be mutated.
transform.translate(new Vector2f());
// @ts-expect-error Construction takes a float rectangle.
new View(new IntRect());
// @ts-expect-error Pixels use signed integer vectors.
target.mapPixelToCoords(new Vector2f());
// @ts-expect-error World coordinates use float vectors.
target.mapCoordsToPixel(new Vector2i());
void [
  center, size, rotation, viewport, scissor, transform, inverse, vp, clip,
  world, pixel, active, srgb,
];
