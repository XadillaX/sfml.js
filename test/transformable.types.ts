import {
  Transformable, Transform, Sprite, Texture, Vector2f, Vector2i, Vector2u,
  Angle, degrees, type ReadonlyValue, RenderTexture,
} from '../src';

const value = new Transformable();
const sprite = new Sprite(new Texture(new Vector2u(4, 4)));
const base: Transformable = sprite;
const constant: ReadonlyValue<Transformable> = value;
const constantSprite: ReadonlyValue<Sprite> = sprite;
const point: ReadonlyValue<Vector2f> = new Vector2f(1, 2);
const angle: ReadonlyValue<Angle> = Angle.Zero;
new Transformable(constant);
new Transformable(constantSprite);
base.setPosition(point);
base.setScale(point);
base.setOrigin(point);
base.setRotation(angle);
base.rotate(degrees(30));
base.scale(point);
base.move(point);
const position: Vector2f = constant.getPosition();
const rotation: Angle = constant.getRotation();
const scale: Vector2f = constant.getScale();
const origin: Vector2f = constant.getOrigin();
const transform: ReadonlyValue<Transform> = constant.getTransform();
const inverse: ReadonlyValue<Transform> = constant.getInverseTransform();
new Transform(transform).translate(point);
inverse.transformPoint(point);

class Entity extends Transformable {
  update(): void { this.move(point); }
}
new Entity().update();

// @ts-expect-error Const transformables cannot be moved.
constant.move(point);
// @ts-expect-error Const Sprite cannot change its inherited state.
constantSprite.setPosition(point);
// @ts-expect-error Cached transforms are const.
transform.translate(point);
// @ts-expect-error Cached inverse transforms are const.
inverse.scale(point);
// @ts-expect-error Rotation uses Angle, not degrees as a raw number.
sprite.setRotation(90);
// @ts-expect-error Origin uses the float vector specialization.
sprite.setOrigin(new Vector2i());
// @ts-expect-error Scale uses a vector, not a scalar.
sprite.setScale(2);
// @ts-expect-error Transform is not a decomposed Transformable.
new Transformable(new Transform());
// @ts-expect-error Transformable is not a drawable.
new RenderTexture(new Vector2u(4, 4)).draw(value);
// @ts-expect-error A Sprite still requires a texture after applying the mixin.
new Sprite();
// @ts-expect-error Sprite constructors retain their argument types.
new Sprite(value);

void [ position, rotation, scale, origin ];
