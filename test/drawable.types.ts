import {
  Drawable, RenderTarget, RenderTexture, RenderStates, Transformable,
  Transform, Texture, Sprite, Vector2f, Vector2u, Color, CoordinateType,
  BlendMode, BlendFactor, BlendEquation, BlendAdd, BlendNone,
  StencilMode, StencilValue, StencilComparison, StencilUpdateOperation,
  type ReadonlyRenderStates,
} from '../src';

class Group extends Drawable {
  readonly pose = new Transformable();

  constructor(readonly children: Drawable[]) { super(); }

  protected draw(target: RenderTarget, states: RenderStates): void {
    states.transform.combine(this.pose.getTransform());
    for (const child of this.children) target.draw(child, states);
  }
}

class ShiftedSprite extends Sprite {
  protected draw(target: RenderTarget, states: RenderStates): void {
    states.transform.translate(new Vector2f(1, 0));
    super.draw(target, states);
  }
}

const texture = new Texture(new Vector2u(8, 8));
const group = new Group([ new Sprite(texture), new ShiftedSprite(texture) ]);
const target: RenderTarget = new RenderTexture(
  new Vector2u(64, 64), { stencilBits: 8 });
const states = new RenderStates({
  blendMode: BlendAdd,
  stencilMode: new StencilMode({
    stencilComparison: StencilComparison.Equal,
    stencilUpdateOperation: StencilUpdateOperation.Keep,
    stencilReference: new StencilValue(2), stencilMask: 0xff,
  }),
  transform: Transform.Identity, coordinateType: CoordinateType.Pixels,
  texture, shader: null,
});
const defaults: ReadonlyRenderStates = RenderStates.Default;
const blend: Readonly<BlendMode> = defaults.blendMode;
const coordinate: CoordinateType = defaults.coordinateType;
const stencil: Readonly<StencilValue> = defaults.stencilMode.stencilMask;
target.clear(Color.Black, stencil);
target.clearStencil(0);
target.draw(group);
target.draw(group, states);
target.draw(group, defaults);
target.draw(group, Transform.Identity);
target.draw(group, BlendNone);
target.draw(group, new StencilMode());
target.draw(group, texture);
target.draw(group, null);
target.flush();
states.transform = group.pose.getTransform();
states.blendMode = new BlendMode(
  BlendFactor.One, BlendFactor.Zero, BlendEquation.Add);
new RenderStates(defaults).transform.translate(new Vector2f(1, 2));

// @ts-expect-error A Drawable is abstract.
new Drawable();
// @ts-expect-error A RenderTarget is abstract.
new RenderTarget(new ArrayBuffer(0));
// @ts-expect-error Subclasses must implement draw.
class MissingDraw extends Drawable {}
// @ts-expect-error The custom callback is protected.
group.draw(target, states);
// @ts-expect-error Sprite exposes draw through RenderTarget, not directly.
new Sprite(texture).draw(target, states);
// @ts-expect-error Transformable alone is not drawable.
target.draw(group.pose);
// @ts-expect-error Default members are not optional or mutable.
defaults.coordinateType = CoordinateType.Normalized;
// @ts-expect-error Default transform must not be mutated.
defaults.transform.translate(new Vector2f());
// @ts-expect-error Blend constants are immutable.
defaults.blendMode.colorSrcFactor = BlendFactor.Zero;
// @ts-expect-error Stencil constants recursively protect reference and mask.
defaults.stencilMode.stencilMask.value = 0;
// @ts-expect-error A shader reference must be a Shader resource.
new RenderStates({ shader: {} });
// @ts-expect-error Stencil clear requires an integer value, not color.
target.clearStencil(Color.Black);

void [ blend, coordinate, MissingDraw ];
